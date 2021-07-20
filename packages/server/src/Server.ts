import morgan from "morgan";
import helmet from "helmet";
import express, { Router } from "express";
import cors from "cors";
import { apiPath } from "./common/constants";
import ActantsRouter from "@modules/actants";
import TerritoriesRouter from "@modules/territories";
import MetaRouter from "@modules/meta";
import UsersRouter from "@modules/users";
import ActionsRouter from "@modules/actions";
import StatementsRouter from "@modules/statements";
import TreeRouter from "@modules/tree";
import Acl from "@middlewares/acl";
import dbMiddleware from "@middlewares/db";
import profilerMiddleware from "@middlewares/profiler";
import errorsMiddleware, { catchAll } from "@middlewares/errors";

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Show routes called in console during development
if (process.env.NODE_ENV === "devel") {
  server.use(morgan("dev"));
}

// Securing
if (process.env.NODE_ENV === "prod") {
  server.use(helmet());
}

server.get("/health", function (req, res) {
  console.log("health route");
  res.send("ok");
});

server.use(profilerMiddleware);

server.use(dbMiddleware);

// uncomment this to enable auth
server.use(validateJwt().unless({ path: [/api\/v1\/users\/signin/] }));

// Routing
const routerV1 = Router();

server.use(apiPath, routerV1);

// uncomment this to enable acl
const acl = new Acl();
routerV1.use(acl.authorize);

//routerV1.use('/statements', StatementRouter);.
routerV1.use("/users", UsersRouter);
routerV1.use("/actants", ActantsRouter);
routerV1.use("/actions", ActionsRouter);
routerV1.use("/territories", TerritoriesRouter);
routerV1.use("/meta", MetaRouter);
routerV1.use("/statements", StatementsRouter);
routerV1.use("/tree", TreeRouter);

// unknown paths (after jwt check) should return 404
server.all("*", catchAll);

// Errors
server.use(errorsMiddleware);

export default server;
