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
    if (!res.headersSent) {
      return originalEnd.call(this, data, encoding, cb);
    } else {
      console.error("Attempted to end response after headers were sent");
      return this;
    }
  };
  
  next();
}
