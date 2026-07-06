import { unauthorizedError } from "@middlewares/errors";
import { NextFunction, Request, Response } from "express";

const publicPathPatterns = [
  /api(\/[^\/]+)?\/users\/password_reset/,
  /api(\/[^\/]+)?\/users\/signin/,
  /api(\/[^\/]+)?\/users\/signout/,
  /api(\/[^\/]+)?\/users\/activation/,
  /api(\/[^\/]+)?\/users\/password/,
  /api(\/[^\/]+)?\/users\/owner/,
  /api(\/[^\/]+)?\/pythondata/,
  /api(\/[^\/]+)?\/health/,
  /api(\/[^\/]+)?\/dev\/simulate-html-error/,
];

function isPublicPath(path: string): boolean {
  return publicPathPatterns.some((pattern) => pattern.test(path));
}

function setRequestUser(req: Request, userId: string): void {
  req.user = { user: { id: userId } };
}

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.session?.userId;
  if (userId) {
    setRequestUser(req, userId);
    next();
    return;
  }

  if (isPublicPath(req.path)) {
    next();
    return;
  }

  next(unauthorizedError);
}
