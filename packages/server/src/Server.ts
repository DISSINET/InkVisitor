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

import ActantRouter from "@modules/actant";
import TerritoryRouter from "@modules/territory";
import MetaRouter from "@modules/meta";

const server = express();
server.use(cors());

/*
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
*/

// Middleware that will open a connection to the database.
// server.use(createConnection);

server.use(express.json());

server.use(express.urlencoded({ extended: true }));
server.use(cookieParser(cookieProps.secret));

// Show routes called in console during development
if (process.env.NODE_ENV === "devel") {
  server.use(morgan("dev"));
}

// Securing
if (process.env.NODE_ENV === "prod") {
  server.use(helmet());
}

server.get("/", function (req, res) {
  console.log("testing");
  res.send("test output");
});

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
