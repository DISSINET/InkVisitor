import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";

import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import { BAD_REQUEST } from "http-status-codes";
import "express-async-errors";

import logger from "@common/Logger";
import { cookieProps } from "@common/constants";

import ActantRouter from "src/modules/actant";
import TerritoryRouter from "src/modules/territory";
import MetaRouter from "src/modules/meta";

import {
  createConnection,
  closeConnection,
  rethinkConfig,
} from "@service/RethinkDB";

const server = express();
server.use(cors());

// Middleware that will open a connection to the database.
// server.use(createConnection);

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser(cookieProps.secret));

// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
}

// Securing
if (process.env.NODE_ENV === "production") {
  server.use(helmet());
}

//----------------------------------------------------------------------------
import jwt from "express-jwt";
import jwks from "jwks-rsa";

const jwtCheck: jwt.RequestHandler = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://dissinet.eu.auth0.com/.well-known/jwks.json",
  }),
  audience: "Inkvisitor",
  issuer: "https://dissinet.eu.auth0.com/",
  algorithms: ["RS256"],
});

//@ts-ignore
//server.use(jwtCheck);

//----------------------------------------------------------------------------

server.get("/private", function (req, res) {
  res.send("Private resource");
});

// Routing
const routerV1 = Router();

server.use("/api/v1", routerV1);

//routerV1.use('/statements', StatementRouter);
routerV1.use("/actants", ActantRouter);
routerV1.use("/territory", TerritoryRouter);
routerV1.use("/meta", MetaRouter);

// Errors
// server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//     logger.error(err.message, err);
//     return res.status(BAD_REQUEST).json({
//         error: err.message,
//     });
// });

// Middleware that will close a connection to the database.
// server.use(closeConnection)

export default server;
