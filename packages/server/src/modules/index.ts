import { IResponseGeneric } from "@inkvisitor/shared/types";
import { getErrorByCode, IErrorSignature } from "@inkvisitor/shared/types/errors";
import { RequestHandler } from "express";
import { IRequest } from "src/custom_typings/request";
import { aclGuard } from "@middlewares/acl";

export function asyncRouteHandler<T = unknown>(
  fn: (req: IRequest) => Promise<T>
): RequestHandler {
  return aclGuard(async (req, res) => {
    const returnedData = await fn(req);
    if ((returnedData as IResponseGeneric).error) {
      const errInstance = getErrorByCode(returnedData as IErrorSignature);
      res.status(errInstance.statusCode());
    }
    res.json(returnedData);
  });
}
