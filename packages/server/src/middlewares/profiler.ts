import { Response, Request, NextFunction } from "express";

const threshold = 200; // 200 ms

export default function profilerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  res.once("finish", () => {
    const elapsed = Date.now() - start;
    if (elapsed > threshold) {
      console.log(
        `[${new Date().toUTCString()}] Slow query(${elapsed}ms): ${
          req.baseUrl + req.route.path
        }`
      );
    }
  });

  next();
}
