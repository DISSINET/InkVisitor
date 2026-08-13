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

// Vite content-hashes every bundled file name ("index-B3xKz9pQ.js"), so a name
// matching this pattern can never point at different content — safe to cache
// forever. Unhashed files (public/ fonts, logos, favicon) keep express's
// default revalidation.
const hashedAssetName = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

// Built once: serves client assets (cwd-relative path, matching the WORKDIR).
// Exported so the STATIC_PATH-prefixed mount serves with the same cache policy.
export const serveAsset = express.static("../client/dist", {
  setHeaders: (res, filePath) => {
    const name = path.basename(filePath);
    if (name === "index.html") {
      // The entry point is the only unhashed link to the hashed bundles; a
      // cached copy keeps referencing chunks that a newer deploy has removed.
      res.setHeader("Cache-Control", "no-cache");
    } else if (hashedAssetName.test(name)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
});

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
    // Same policy as index.html served as an asset: revalidate on every load
    // so the entry point always references the current deploy's bundles.
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(html);
  });
}
