import { Db } from "@service/RethinkDB";
import Acl from "../middlewares/acl";
import { IUser } from "../../../shared/types";
import User from "@models/user/user";

export interface IRequest {
  db: Db;
  acl: Acl;
  user?: {
    user: IUser;
  };
  getUserOrFail(): User;
  baseUrl: string;
  route: { path: string };
  method: string;
  params: Record<string, any>;
  body: Record<string, any>;
  query: Record<string, any>;
}

declare global {
  namespace Express {
    export interface Request extends IRequest { }
  }
}
