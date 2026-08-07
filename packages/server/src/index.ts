import "./settings"; // Must be the first import

import fs from "fs";
import https from "https";
import http from "http";
import { Server as SocketIO, Socket } from "socket.io";
import server from "./server";
import { prepareTreeCache } from "@service/treeCache";
import "@service/mailer";
import { Db } from "@service/rethink";
import { CronService } from "@service/cron";
import { startDbStatsEmitter } from "@service/dbStats";
import { startDocumentPresence } from "@service/documentPresence";
import { startCacheInvalidators } from "@service/changefeedInvalidator";
import { assertRequiredIndexes } from "@service/assertRequiredIndexes";
import { ensureSessionsTable } from "@service/rethinkSessionStore";
import {
  cookieParserMiddleware,
  sessionMiddleware,
} from "@middlewares/session";
import { getAllowedOrigins } from "@common/allowedOrigins";
import Document from "@models/document/document";

(async () => {
  const db = new Db();
  await db.initDb();

  await assertRequiredIndexes(db.connection);
  await ensureSessionsTable(db.connection);

  const backfilled = await Document.backfillEntityIds(db.connection);
  if (backfilled > 0) {
    console.log(`[startup] backfilled entityIds for ${backfilled} documents`);
  }

  await prepareTreeCache(db.connection);

  startCacheInvalidators();

  const cronService = new CronService(db.connection);
  cronService.start();

  const port = Number(process.env.PORT || 3000);
  const useHttps = process.env.HTTPS === "1";

  let httpServer: http.Server | https.Server;

  if (useHttps) {
    httpServer = https.createServer(
      {
        key: fs.readFileSync("secret/key.pem"),
        cert: fs.readFileSync("secret/cert.pem"),
      },
      server
    );
  } else {
    httpServer = http.createServer(server);
  }

  const socketio = new SocketIO(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
    path: "/socket.io/",
  });

  socketio.engine.use(cookieParserMiddleware);
  socketio.engine.use(sessionMiddleware);

  socketio.on("connection", (socket: Socket) => {
    socket.on("ping", (callback) => {
      callback();
    });
  });

  startDbStatsEmitter(socketio);
  startDocumentPresence(socketio);

  httpServer.listen(port, () => {
    console.log(
      `[Server] ${useHttps ? "https" : "http"} server listening at port ${port}`
    );
  });
})();
