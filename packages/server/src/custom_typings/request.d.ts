import { Db } from "@service/rethink";
import Acl from "../middlewares/acl";
import { IUser } from "../../../shared/types";
import User from "@models/user/user";

export interface IRequest<TParams = any, TBody = any, TQuery = any> {
  db: Db;
  acl: Acl;
  user?: {
    user: IUser;
  };
  getUserOrFail(): User;
  baseUrl: string;
  route: { path: string };
  method: string;
  params: TParams;
  body: TBody;
  query: TQuery;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Request extends IRequest {}
  }
}
