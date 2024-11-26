import morgan from "morgan";
import helmet from "helmet";
import express, { NextFunction, Router } from "express";
import cors from "cors";
import { apiPath } from "@common/constants";
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
import Acl from "@middlewares/acl";
import customizeRequest from "@middlewares/request";
import dbMiddleware from "@middlewares/db";
import profilerMiddleware from "@middlewares/profiler";
import errorsMiddleware, { catchAll } from "@middlewares/errors";
import { validateJwt } from "@common/auth";
import compression from "compression";
import * as path from "path";
import rateLimit from "express-rate-limit";
import "@models/events/register";
import { Request, Response } from "express";
import { TooManyRequestsError } from "@shared/types/errors";

const server = express();

server.use(
  compression({
    threshold: 0,
  })
);

server.use(cors());

if (!!process.env.STATIC_PATH) {
  if (process.env.STATIC_PATH === "/") {
    server.use((req, res, next) => {
      // allow all requests not starting with /api and that are pointed to wanted static path
      // relative to the root like domain.com/<static path>/...
      if (
        !req.path.startsWith("/api") &&
        req.path.startsWith(process.env.STATIC_PATH as string)
      ) {
        if (req.path.indexOf(".") === -1) {
          // replacement for react(client) router that should process only pages alone (/, /login etc)
          res.sendFile(
            path.join(
              __dirname,
              "..",
              "..",
              "..",
              "..",
              "client/dist/index.html"
            )
          );
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
    server.use(
      process.env.STATIC_PATH as string,
      express.static("../client/dist")
    );
  }
}

server.use(express.json({ limit: "150mb" }));
server.use(express.urlencoded({ extended: true, limit: "150mb" }));

// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
}

// Securing
if (process.env.NODE_ENV === "production") {
  server.use(helmet());
}

// Health route
server.get("/health", function (req, res) {
  res.send("ok");
});

// Rate limited for signin
server.use(
  `${apiPath}/users/signin`,
  rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes window
    max: 5, // Limit each IP to 5 requests per windowMs
    handler: (req: Request, res: Response, next: NextFunction, options) => {
      throw new TooManyRequestsError(
        `${TooManyRequestsError.title}: try again in 5 minutes`
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

server.use(profilerMiddleware);

server.use(dbMiddleware);

// uncomment this to enable auth
server.use(
  validateJwt().unless({
    path: [
      /api\/v1\/users\/password_reset/,
      /api\/v1\/users\/signin/,
      /api\/v1\/users\/activation/,
      /api\/v1\/users\/password/,
      /api\/v1\/users\/owner/,
      /api\/v1\/pythondata/,
    ],
  })
);
server.use(customizeRequest);

// Routing
const routerV1 = Router();

server.use(apiPath, routerV1);

// uncomment this to enable acl
const acl = new Acl();
routerV1.use(acl.authorize);

//routerV1.use('/statements', StatementRouter);
routerV1.use("/acls", AclRouter);
routerV1.use("/users", UsersRouter);
routerV1.use("/entities", EntitiesRouter);
routerV1.use("/audits", AuditsRouter);
routerV1.use("/relations", RelationsRouter);
routerV1.use("/territories", TerritoriesRouter);
routerV1.use("/statements", StatementsRouter);
routerV1.use("/tree", TreeRouter);
routerV1.use("/stats", StatsRouter);
routerV1.use("/documents", DocumentsRouter);
routerV1.use("/pythondata", PythonApiRouter);
routerV1.use("/settings", SettingsRouter);

// unknown paths (after jwt check) should return 404
server.all("*", catchAll);

// Errors
server.use(errorsMiddleware);

acl.assignRoutes(routerV1);

export default server;
