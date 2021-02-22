import morgan from "morgan";
import helmet from "helmet";
import { IError } from "@common/errors";
import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import { BAD_REQUEST } from "http-status-codes";
import "express-async-errors";
import { createConnection, closeConnection } from "@service/RethinkDB";
import logger from "@common/Logger";

import ActantRouter from "@modules/actant";
import TerritoryRouter from "@modules/territory";
import MetaRouter from "@modules/meta";
import UsersRouter from "@modules/users";

const server = express();
server.use(cors());

// Middleware that will open a connection to the database.
server.use(createConnection);

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

server.use(validateJwt().unless({ path: [/api\/v1\/users/] }));

// Routing
const routerV1 = Router();

server.use("/api/v1", routerV1);

//routerV1.use('/statements', StatementRouter);.
routerV1.use("/users", UsersRouter);
routerV1.use("/actants", ActantRouter);
routerV1.use("/territory", TerritoryRouter);
routerV1.use("/meta", MetaRouter);

// Errors
server.use(
  (err: IError | Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    return res
      .status(
        typeof (err as IError).statusCode === "function"
          ? (err as IError).statusCode()
          : BAD_REQUEST
      )
      .json({
        error: err.toString(),
      });
  }
);

// Middleware that will close a connection to the database.
server.use(closeConnection);

export default server;
