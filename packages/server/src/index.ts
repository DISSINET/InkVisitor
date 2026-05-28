import "./settings"; // Must be the first import

import fs from "fs";
import https from "https";
import http from "http";
import { Server as SocketIO, Socket } from "socket.io";
import server from "./Server";
import { prepareTreeCache } from "@service/treeCache";
import "@service/mailer";
import { Db } from "@service/rethink";
import { CronService } from "@service/cron";
import { startDbStatsEmitter } from "@service/dbStats";
import { startCacheInvalidators } from "@service/changefeedInvalidator";

(async () => {
  const db = new Db();
  await db.initDb();
  await prepareTreeCache(db.connection);

  // Background listeners that invalidate the users/settings TtlCache entries
  // when those tables are written from anywhere (this process, another
  // replica, out-of-band scripts). Runs in the background; failures do not
  // block startup.
  startCacheInvalidators();
  
  // Initialize cron service for stats aggregation
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
      origin: "*",
    },
    path: "/socket.io/",
  });

  socketio.on("connection", (socket: Socket) => {
    socket.on("ping", (callback) => {
      callback();
    });
  });

  startDbStatsEmitter(socketio);

  httpServer.listen(port, () => {
    console.log(
      `[Server] ${useHttps ? "https" : "http"} server listening at port ${port}`
    );
  });
})();
