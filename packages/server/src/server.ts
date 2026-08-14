import morgan from "morgan";
import helmet from "helmet";
import express, { NextFunction, Router } from "express";
import { corsMiddleware } from "@middlewares/cors";
import { csrfProtection } from "@middlewares/csrf";
import { apiPath, apiPathOld } from "@common/constants";
import { getTrustProxy } from "@common/trustProxy";
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
import SavedQueriesRouter from "@modules/saved-queries";
import Acl from "@middlewares/acl";
import customizeRequest from "@middlewares/request";
import dbMiddleware from "@middlewares/db";
import profilerMiddleware from "@middlewares/profiler";
import headersProtectionMiddleware from "@middlewares/headers-protection";
import errorsMiddleware, { catchAll } from "@middlewares/errors";
import serveClientApp, { serveAsset } from "@middlewares/static-client";
import { authenticateRequest } from "@middlewares/auth";
import {
  cookieParserMiddleware,
  sessionMiddleware,
} from "@middlewares/session";
import compression from "compression";
import rateLimit from "express-rate-limit";
import "@models/events/register";
import { Request, Response } from "express";
import { TooManyRequestsError } from "@inkvisitor/shared/types/errors";
import { r as rethink } from "rethinkdb-ts";
import timeout from "connect-timeout";
import { pool } from "@middlewares/db";

const server = express();

// In every deployment the node process sits behind a TLS-terminating reverse
// proxy, so the inbound connection is plain HTTP and req.secure is false.
// Without this, express-session sees `cookie.secure: true` on an "insecure"
// request and silently drops Set-Cookie, and express-rate-limit keys every
// client to the proxy's IP. TRUST_PROXY is the hop count between the client and
// this process; keep it exact rather than `true`, which would let anyone spoof
// X-Forwarded-For and bypass the signin rate limit.
server.set("trust proxy", getTrustProxy());

server.use(
  compression({
    threshold: 0,
    filter: (req, res) => {
      if (req.path.includes("/backups/download")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

server.use(corsMiddleware);

const staticPath = process.env.STATIC_PATH;
if (staticPath === "/") {
  server.use(serveClientApp);
} else if (staticPath) {
  server.use(staticPath, serveAsset);
}

server.use(express.json({ limit: "150mb" }));
server.use(express.urlencoded({ extended: true, limit: "150mb" }));
server.use((req, res, next) =>
  timeout(req.path.endsWith("/backups/download") ? "5m" : "20s")(req, res, next)
);

if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
}

if (process.env.NODE_ENV === "production") {
  server.use(helmet());
}

if (process.env.NODE_ENV !== "development") {
  server.use(
    `${apiPath}/users/signin`,
    rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 5,
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
server.use(cookieParserMiddleware);
server.use(sessionMiddleware);
server.use(csrfProtection);
server.use(apiPath, dbMiddleware);

server.use(authenticateRequest);
// customizeRequest reads req.db, which only dbMiddleware sets, so both mount on
// the same prefix. The browser sends the session cookie for every path of the
// origin, so authenticateRequest resolves a user on non-api paths too - static
// assets, the SPA fallback, unknown routes - where no db handle exists.
server.use(apiPath, customizeRequest);

const router = Router();
server.use(apiPath, router);
server.use(apiPathOld, router);

// The Dockerfile CMD passes the image build timestamp as the process's first
// argument; clients watch it across /health responses to detect a new deploy.
// Empty outside the container (local dev runs pass no argument).
const buildTimestamp = process.argv[2] || "";

router.get("/health", async function (req, res) {
  await rethink.tableList().run(req.db.connection);
  res.json({
    result: true,
    buildTimestamp,
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

if (process.env.NODE_ENV === "development") {
  router.get("/dev/simulate-html-error", function (_req, res) {
    res
      .status(200)
      .type("html")
      .send("<html><body><p>Simulated overload (dev route)</p></body></html>");
  });
}

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
router.use("/saved-queries", SavedQueriesRouter);

server.all("*", catchAll);

server.use(errorsMiddleware);

acl.assignRoutes(router);

export default server;
