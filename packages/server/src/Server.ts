import morgan from "morgan";
import helmet from "helmet";
import express, { NextFunction, Router } from "express";
import cors from "cors";
import { apiPath, apiPathOld } from "@common/constants";
import EntitiesRouter from "@modules/entities";
import AuditsRouter from "@modules/audits";
import RelationsRouter from "@modules/relations";
import TerritoriesRouter from "@modules/territories";
import UsersRouter from "@modules/users";
import AclRouter from "@modules/acls";
import StatementsRouter from "@modules/statements";
import TreeRouter from "@modules/tree";
import StatsRouter from "@modules/stats";
import PythonApiRouter from "@modules/pythondata";
import SettingsRouter from "@modules/settings";
import DocumentsRouter from "@modules/documents";
import BackupsRouter from "@modules/backups";
import Acl from "@middlewares/acl";
import customizeRequest from "@middlewares/request";
import dbMiddleware from "@middlewares/db";
import profilerMiddleware from "@middlewares/profiler";
import headersProtectionMiddleware from "@middlewares/headers-protection";
import errorsMiddleware, { catchAll } from "@middlewares/errors";
import { validateJwt } from "@common/auth";
import compression from "compression";
import * as path from "path";
import rateLimit from "express-rate-limit";
import "@models/events/register";
import { Request, Response } from "express";
import { TooManyRequestsError } from "@inkvisitor/shared/types/errors";
import { r as rethink } from "rethinkdb-ts";
import timeout from "connect-timeout";
import { pool } from "@middlewares/db";

const server = express();

server.use(
  compression({
    threshold: 0,
    filter: (req, res) => {
      // Backup archives are already compressed; re-compressing breaks Content-Length
      // and prevents the browser from reporting download progress.
      if (req.path.includes("/backups/download")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

server.use(cors());

if (!!process.env.STATIC_PATH) {
  if (process.env.STATIC_PATH === "/") {
    server.use((req, res, next) => {
      // allow all requests not starting with /api
      if (!req.path.startsWith("/api")) {
        if (req.path.indexOf(".") === -1) {
          // Read and modify index.html before sending
          const fs = require("fs");
          const indexPath = path.join(__dirname, "..", "..", "..", "..", "client/dist/index.html");

          fs.readFile(indexPath, "utf8", (err: NodeJS.ErrnoException | null, data: string) => {
            if (err) {
              return next(err);
            }

            if (process.env.ENV) {
              data = data.replace(
                "</head>",
                `  <!-- Injected content -->
                     <script>window.appConfig = { env: "${
                       process.env.ENV || "development"
                     }" };</script>
                  </head>`
              );
            }

            res.type("html");
            res.send(data);
          });
        } else {
          // everythink else will go here
          express.static("../client/dist")(req, res, next);
        }
      } else {
        // fallback to handlers below
        next();
      }
    });
  } else if (process.env.STATIC_PATH !== "") {
    server.use(process.env.STATIC_PATH as string, express.static("../client/dist"));
  }
}

server.use(express.json({ limit: "150mb" }));
server.use(express.urlencoded({ extended: true, limit: "150mb" }));
// Backup archive streams can take minutes on slow links; the default 20s would
// otherwise fire mid-stream and trip "headers already sent" warnings. Match by
// exact suffix so /backups/download-url (small JSON) keeps the default budget.
server.use((req, res, next) =>
  timeout(req.path.endsWith("/backups/download") ? "5m" : "20s")(req, res, next)
);

// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
}

// Securing
if (process.env.NODE_ENV === "production") {
  server.use(helmet());
}

// Rate limited for signin (disabled in development)
if (process.env.NODE_ENV !== "development") {
  server.use(
    `${apiPath}/users/signin`,
    rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes window
      max: 5, // Limit each IP to 5 requests per windowMs
      handler: (req: Request, res: Response, next: NextFunction, options) => {
        throw new TooManyRequestsError(`${TooManyRequestsError.title}: try again in 5 minutes`);
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

server.use(headersProtectionMiddleware);
server.use(profilerMiddleware);
server.use(apiPath, dbMiddleware);

// uncomment this to enable auth
server.use(
  validateJwt().unless({
    path: [
      /api(\/[^\/]+)?\/users\/password_reset/,
      /api(\/[^\/]+)?\/users\/signin/,
      /api(\/[^\/]+)?\/users\/activation/,
      /api(\/[^\/]+)?\/users\/password/,
      /api(\/[^\/]+)?\/users\/owner/,
      /api(\/[^\/]+)?\/pythondata/,
      /api(\/[^\/]+)?\/health/,
      /api(\/[^\/]+)?\/dev\/simulate-html-error/,
    ],
  })
);
server.use(customizeRequest);

// Routing
const router = Router();
server.use(apiPath, router);
server.use(apiPathOld, router); // DEPRECATED , legacy reasons

// Health route
router.get("/health", async function (req, res) {
  await rethink.tableList().run(req.db.connection);
  res.json({
    result: true,
    db: {
      pool: {
        size: pool.pool.size,
        available: pool.pool.available,
        borrowed: pool.pool.size - pool.pool.available,
        pending: pool.pool.pending,
        max: pool.options.max,
      },
    },
  });
});

// Dev-only: simulate proxy/overload HTML body for client error-handling tests (remove before release)
if (process.env.NODE_ENV === "development") {
  router.get("/dev/simulate-html-error", function (_req, res) {
    res
      .status(200)
      .type("html")
      .send("<html><body><p>Simulated overload (dev route)</p></body></html>");
  });
}

// uncomment this to enable acl
const acl = new Acl();
router.use(acl.authorize);

router.use("/acls", AclRouter);
router.use("/users", UsersRouter);
router.use("/entities", EntitiesRouter);
router.use("/audits", AuditsRouter);
router.use("/relations", RelationsRouter);
router.use("/territories", TerritoriesRouter);
router.use("/statements", StatementsRouter);
router.use("/tree", TreeRouter);
router.use("/stats", StatsRouter);
router.use("/documents", DocumentsRouter);
router.use("/pythondata", PythonApiRouter);
router.use("/settings", SettingsRouter);
router.use("/backups", BackupsRouter);

// unknown paths (after jwt check) should return 404
server.all("*", catchAll);

// Errors
server.use(errorsMiddleware);

acl.assignRoutes(router);

export default server;
