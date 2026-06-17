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
export const internalServerError = new InternalServerError(
  "unknown error occured"
);

export default function errorsMiddleware(
  err: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const genericResponse: IResponseGeneric = {
    result: false,
    error: err.constructor.name as errorTypes,
    message: err.message,
  };

  const isCustomError = typeof (err as CustomError).statusCode === "function";
  if (!isCustomError) {
    console.error(red(`[Unhandled error] ${err.message}`));
    console.error(err);
    err = internalServerError;
  } else if ((err as CustomError).shouldLog()) {
    console.error(
      red(`[Error] ${(err as CustomError).name}: ${(err as CustomError).log}`)
    );

    if ((err as CustomError).data) {
      genericResponse.data = (err as CustomError).data;
    }
  }

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
