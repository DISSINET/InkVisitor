import { Request } from "express";
import { UserEnums } from "@shared/enums";
import { IEntity, IResponseStatement, IStatement } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Statement from "./statement";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
  }

  async prepare(req: Request) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
  }
}
