import morgan from "morgan";
import helmet from "helmet";
import { IError } from "@common/errors";
import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import { BAD_REQUEST } from "http-status-codes";
import { createConnection, closeConnection } from "@service/RethinkDB";
import logger from "@common/Logger";
import { apiPath } from "./common/constants";
import ActantsRouter from "@modules/actants";
import TerritoryRouter from "@modules/territory";
import MetaRouter from "@modules/meta";
import UsersRouter from "@modules/users";
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

import { validateJwt } from "@common/auth";
import { UnauthorizedError } from "express-jwt";

server.use(validateJwt().unless({ path: [/api\/v1\/users/] }));

// Routing
const routerV1 = Router();

server.use(apiPath, routerV1);

//routerV1.use('/statements', StatementRouter);.
routerV1.use("/users", UsersRouter);
routerV1.use("/actants", ActantsRouter);
routerV1.use("/territory", TerritoryRouter);
routerV1.use("/meta", MetaRouter);

// Errors
server.use(
  (err: IError | Error, req: Request, res: Response, next: NextFunction) => {
    const isCustomError = typeof (err as IError).statusCode === "function";
    if (!isCustomError && !(err instanceof UnauthorizedError)) {
      logger.error(err.message, err);
    }

    return res
      .status(isCustomError ? (err as IError).statusCode() : BAD_REQUEST)
      .json({
        error: err.toString(),
      });
  }
);

export default server;
