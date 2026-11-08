import { DbHandle } from "@service/dbHandle";
import Acl from "../middlewares/acl";
import { IUser } from "../../../shared/types";
import User from "@models/user/user";

export interface IRequest<TParams = any, TBody = any, TQuery = any> {
  db: DbHandle;
  acl: Acl;
  user?: {
    user: Pick<IUser, "id">;
  };
  getUserOrFail(): User;
  baseUrl: string;
  route: { path: string };
  method: string;
  params: TParams;
  body: TBody;
  query: TQuery;
  headers?: Record<string, string | string[] | undefined>;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Request extends IRequest {}
  }
}
