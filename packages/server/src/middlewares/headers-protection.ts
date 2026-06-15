import { Request, Response, NextFunction } from "express";

/**
 * Global middleware to prevent "headers already sent" errors
 * This happens when timeouts occur and the application tries to send
 * responses after the client connection has already been closed.
 */
export default function headersProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  res.send = function(data) {
    if (!res.headersSent) {
      return originalSend.call(this, data);
    } else {
      console.error("Attempted to send response after headers were sent");
      return this;
    }
  };
  
  res.json = function(data) {
    if (!res.headersSent) {
      return originalJson.call(this, data);
    } else {
      console.error("Attempted to send JSON response after headers were sent");
      return this;
    }
  };
  
  res.end = function(data?: any, encoding?: any, cb?: any) {
    // Streaming responses (e.g. file pipes) flush headers mid-response, so
    // headersSent is true *during* normal end-of-stream. The right guard is
    // writableEnded, which only flips after end() has actually finished.
    if (res.writableEnded) {
      console.error("Attempted to end response after it was already ended");
      return this;
    }
    return originalEnd.call(this, data, encoding, cb);
  };
  
  next();
}
