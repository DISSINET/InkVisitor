import { IResponseGeneric } from "@inkvisitor/shared/types";
import { getErrorByCode, IErrorSignature } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction } from "express";
import { IRequest } from "src/custom_typings/request";

export const supertestConfig = {
  login: "admin",
  password: "admin",
};

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
