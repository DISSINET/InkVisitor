import { Response, Request, NextFunction } from "express";
import {
  InternalServerError,
  UnauthorizedError,
  CustomError,
  NotFound,
} from "@inkvisitor/shared/types/errors";
import { IResponseGeneric, errorTypes } from "@inkvisitor/shared/types/response-generic";
import { red } from "cli-color";

export const unauthorizedError = new UnauthorizedError("unauthorized");
export const unknownRouteError = new NotFound("route does not exist");
export const internalServerError = new InternalServerError();

// the client sends a fresh id with every request; logging it lets an error the
// user reports be matched to its stack trace
const requestIdLabel = (req: Request): string => {
  const id = req.header("x-inkvisitor-request-id");
  return id && /^[\w-]{1,64}$/.test(id) ? ` [request ${id}]` : "";
};

export default function errorsMiddleware(
  err: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = requestIdLabel(req);

  // an unhandled error answers with the generic InternalServerError, so its
  // message and class name stay in the log
  const isCustomError = typeof (err as CustomError).statusCode === "function";
  const sent = isCustomError ? (err as CustomError) : internalServerError;
  const genericResponse: IResponseGeneric = {
    result: false,
    error: sent.constructor.name as errorTypes,
    message: sent.message,
  };

  if (!isCustomError) {
    console.error(red(`[Unhandled error]${requestId} ${err.message}`));
    console.error(err);
  } else if (sent.shouldLog()) {
    console.error(red(`[Error]${requestId} ${sent.name}: ${sent.log}`));

    if (sent.data) {
      genericResponse.data = sent.data;
    }
  }

  res.status(sent.statusCode()).json(genericResponse);
}

export function catchAll(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const genericResponse: IResponseGeneric = {
    result: false,
    error: unknownRouteError.constructor.name as errorTypes,
    message: unknownRouteError.message,
  };

  res.status(unknownRouteError.statusCode()).json(genericResponse);
}
