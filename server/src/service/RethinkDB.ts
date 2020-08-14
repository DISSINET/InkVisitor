import { Connection, r as rethink } from "rethinkdb-ts"
import { Express, NextFunction, Request, Response } from "express"


declare global {
    namespace Express {
        export interface Request {
            rethink: Connection
        }
    }
}

let rethinkConfig: {
    host: "localhost",
    port: 6000,
    authKey: "",
    db: "dissinet"
};


/**
 * Send back a 500 error.
 */
function handleErrorMiddleware(response: Response) {
    return (error: any) => {
        const status = 500;
        const message = error.message
        response.send({ status, message });
    }
}

/**
 * Open RethinkDB connection and store in `request.rethink`.
 */
const createConnection = async (request: Request, ressponse: Response, next: NextFunction) => {
    await rethink.connectPool(rethinkConfig);
    const connection = await rethink.connect(rethinkConfig);
    request.rethink = connection;
}

/*
 * Close the RethinkDB connection stored in `request.rethink`.
 */
const closeConnection = async (request: Request, ressponse: Response, next: NextFunction) => {
    await request.rethink.close();
}
