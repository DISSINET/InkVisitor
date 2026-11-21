import { IResponseGeneric } from "@inkvisitor/shared/types";
import { getErrorByCode, IErrorSignature } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction } from "express";
import { IRequest } from "src/custom_typings/request";
import { aclGuard } from "@middlewares/acl";

export const supertestConfig = {
  login: "admin",
  password: "admin",
};

export function asyncRouteHandler<T = unknown>(
  fn: (req: IRequest) => Promise<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return aclGuard(async (req: Request, res: Response, next: NextFunction) => {
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
  });
}
