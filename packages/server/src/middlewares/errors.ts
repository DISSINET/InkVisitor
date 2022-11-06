import { Response, Request, NextFunction } from "express";
import {
  InternalServerError,
  UnauthorizedError,
  CustomError,
  NotFound,
} from "@shared/types/errors";
import { UnauthorizedError as JwtUnauthorizedError } from "express-jwt";
import { IResponseGeneric, errorTypes } from "@shared/types/response-generic";
import { red } from "cli-color";

export const unauthorizedError = new UnauthorizedError("unauthorized");
export const unknownRouteError = new NotFound("route does not exist");
export const internalServerError = new InternalServerError(
  "unknown error occured"
);

export default function errorsMiddleware(
  err: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // should expect customized errors, unknown unhandled errors, or errors thrown from some lib
  const isCustomError = typeof (err as CustomError).statusCode === "function";
  if (!isCustomError) {
    if (err instanceof JwtUnauthorizedError) {
      // customized unauthorized error
      err = unauthorizedError;
    } else {
      // unknown unhandled error - should log the message
      console.error(red(`[Unhandled error] ${err.message}`))
      console.error(err);

      // hide details for client
      err = internalServerError;
    }
  } else if ((err as CustomError).shouldLog()) {
    console.error(red(`[Error] ${(err as CustomError).name}: ${(err as CustomError).log}`));
  }

  // in any case, the error should be wrapper in IResponseGeneric
  const genericResponse: IResponseGeneric = {
    result: false,
    error: err.constructor.name as errorTypes,
    message: err.message,
  };

  res.status((err as CustomError).statusCode()).json(genericResponse);
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
