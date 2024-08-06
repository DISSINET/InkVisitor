import { IResponseGeneric } from "@shared/types";
import { getErrorByCode, IErrorSignature } from "@shared/types/errors";
import { Response, Request, NextFunction } from "express";
import { IRequest } from "src/custom_typings/request";

/**
 * Wrapper around each api route - handles explicitly thrown errors which could not be handled
 * by out express err handler(see server.ts).
 *
 * Handles db connection init & closing. In case of an unexpected error, the latter procedure is not reliable.
 * Thats why we are handling db connection here and not in the middlewares.
 * @param fn - the function handler for each route
 */
export function asyncRouteHandler<T = unknown>(
  fn: (req: IRequest) => Promise<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.acl) {
      const err = await req.acl.validate(req);
      if (err) {
        next(err);
        return;
      }
    }

    try {
      const returnedData = await fn(req);
      if ((returnedData as IResponseGeneric).error) {
        const errInstance = getErrorByCode(returnedData as IErrorSignature);
        res.status(errInstance.statusCode());
      }
      res.json(returnedData);
    } catch (err) {
      next(err);
    }
  };
}

export const supertestConfig = {
  token: process.env.TEST_JWT_TOKEN,
  username: "admin",
};
