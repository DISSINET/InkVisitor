import { Response, Request, NextFunction } from "express";

/**
 * Wrapper around each api route - handles explicitly thrown errors which could not be handled
 * by out express err handler(see server.ts).
 *
 * Handles db connection init & closing. In case of an unexpected error, the latter procedure is not reliable.
 * Thats why we are handling db connection here and not in the middlewares.
 * @param fn - the function handler for each route
 */
export function asyncRouteHandler<T = unknown>(
  fn: (req: Request) => Promise<T>
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
