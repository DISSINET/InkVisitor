import express, { Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";

// index.html is resolved relative to this compiled module
// (dist/server/src/middlewares) so it works regardless of cwd; the five "../"
// climb to the deploy root, where the client bundle sits alongside the server.
const indexPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "client/dist/index.html"
);

// Built once: serves client assets (cwd-relative path, matching the WORKDIR).
const serveAsset = express.static("../client/dist");

/**
 * SPA fallback, mounted when STATIC_PATH === "/". Requests with a file
 * extension are served as static assets; every other non-/api path returns
 * index.html with the runtime env injected, so the client can read
 * window.appConfig.env. /api paths fall through to the API routes.
 */
export default function serveClientApp(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path.startsWith("/api")) {
    return next();
  }
  if (req.path.includes(".")) {
    return serveAsset(req, res, next);
  }

  fs.readFile(indexPath, "utf8", (err, html) => {
    if (err) {
      return next(err);
    }
    if (process.env.ENV) {
      html = html.replace(
        "</head>",
        `  <!-- Injected content -->
    <script>window.appConfig = { env: "${process.env.ENV}" };</script>
  </head>`
      );
    }
    res.type("html").send(html);
  });
}
