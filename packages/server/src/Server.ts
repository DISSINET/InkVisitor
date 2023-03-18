import morgan from "morgan";
import helmet from "helmet";
import express, { Router } from "express";
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
import Acl from "@middlewares/acl";
import customizeRequest from "@middlewares/request";
import dbMiddleware from "@middlewares/db";
import profilerMiddleware from "@middlewares/profiler";
import errorsMiddleware, { catchAll } from "@middlewares/errors";
import { validateJwt } from "@common/auth";
import compression from "compression";
import * as swaggerUi from "swagger-ui-express";

import "@models/events/register";
import { readFileSync } from "fs";

const server = express();

server.use(
  compression({
    threshold: 0,
  })
);

server.use(cors());

if (process.env.STATIC_PATH && process.env.STATIC_PATH !== "") {
  server.use(
    process.env.STATIC_PATH as string,
    express.static("../client/dist")
  );
}

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

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
  console.log("health route");
  res.send("ok");
});

// Swagger UI
if (!!process.env.SWAGGER_FILE) {
  const swaggerFileData = readFileSync(process.env.SWAGGER_FILE)
  if (!swaggerFileData) {
    throw new Error(`Cannot load swagger file from '${process.env.SWAGGER_FILE}'`)
  }
  console.info(`[Server] serving swagger file from '${process.env.SWAGGER_FILE}'`)
  server.use('/api-docs', swaggerUi.serve);
  server.get('/api-docs', swaggerUi.setup(JSON.parse(swaggerFileData.toString())));
}

server.use(profilerMiddleware);

server.use(dbMiddleware);

// uncomment this to enable auth
server.use(
  validateJwt().unless({
    path: [
      /api\/v1\/users\/signin/,
      /api\/v1\/users\/active/,
      /api\/v1\/users\/password/,
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

// unknown paths (after jwt check) should return 404
server.all("*", catchAll);

// Errors
server.use(errorsMiddleware);

acl.assignRoutes(routerV1);

export default server;
