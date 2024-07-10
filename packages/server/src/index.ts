import "./settings"; // Must be the first import

import http from "http";
import { Server as SocketIO, Socket } from "socket.io";
import server from "./Server";
import { prepareTreeCache } from "@service/treeCache";
import "@service/mailer";
import { Db } from "@service/rethink";

(async () => {
  const db = new Db();
  await db.initDb();
  await prepareTreeCache(db.connection);
  const port = Number(process.env.PORT || 3000);

  const httpServer = http.createServer(server);

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

  httpServer.listen(port, () => {
    console.log(
      `[Server] http server listening at port ${port}`
    );
  });
})();
