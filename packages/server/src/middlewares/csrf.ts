import { isAllowedOrigin } from "@common/allowedOrigins";
import { PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { NextFunction, Request, Response } from "express";

export const CSRF_CLIENT_HEADER = "x-inkvisitor-client";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function refererOrigin(referer: string): string | undefined {
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

function hasTrustedOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (typeof origin === "string" && isAllowedOrigin(origin)) {
    return true;
  }

  const referer = req.headers.referer;
  if (typeof referer === "string") {
    const fromReferer = refererOrigin(referer);
    if (fromReferer && isAllowedOrigin(fromReferer)) {
      return true;
    }
  }

  return false;
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === "test") {
    next();
    return;
  }

  if (SAFE_METHODS.has(req.method) || !req.path.startsWith("/api")) {
    next();
    return;
  }

  if (req.headers[CSRF_CLIENT_HEADER] !== "1") {
    next(new PermissionDeniedError("invalid request"));
    return;
  }

  if (!hasTrustedOrigin(req)) {
    next(new PermissionDeniedError("invalid origin"));
    return;
  }

  next();
}
