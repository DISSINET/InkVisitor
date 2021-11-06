import "./settings"; // Must be the first import

import server from "./Server";
import logger from "@common/Logger";

import fs from "fs";

import https from "https";
import http from "http";
import { prepareTreeCache } from "@service/treeCache";
import "@service/mailer";

// Start the server
(async () => {
  await prepareTreeCache();
  const port = Number(process.env.PORT || 3000);
  const httpServer = http.createServer(server);
  const httpsServer = https.createServer(
    {
      key: fs.readFileSync("secret/key.pem"),
      cert: fs.readFileSync("secret/cert.pem"),
    },
    server
  );

  httpsServer.listen(port, () => {
    logger.info("Express server started on port: " + port);
    console.log("https server working at port", port);
  });

  if (process.env.HTTP != "0") {
    const httpPort = Number(process.env.HTTP);
    httpServer.listen(httpPort, () => {
      console.log("http server working at port", httpPort);
    });
  }
})();
