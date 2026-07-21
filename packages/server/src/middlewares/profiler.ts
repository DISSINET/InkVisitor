import { Response, Request, NextFunction } from "express";

const threshold = 200; // 200 ms

// Slow query logging is on unless LOG_SLOW_QUERIES explicitly disables it, so
// an unset variable keeps the previous behaviour.
const enabled = !["0", "false", "no", "off"].includes(
  (process.env.LOG_SLOW_QUERIES || "").trim().toLowerCase()
);

export default function profilerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!enabled) {
    next();
    return;
  }

  const start = Date.now();
  res.once("finish", () => {
    const elapsed = Date.now() - start;
    if (req.baseUrl && req.route.path && elapsed > threshold) {
      console.log(
        `[${new Date().toUTCString()}] Slow query(${elapsed}ms): ${
          req.baseUrl + req.route.path
        }`
      );
    }
  });

  next();
}
