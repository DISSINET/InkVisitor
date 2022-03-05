import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import { IEntity, IResponseStatement } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Statement from "./statement";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity };
  right: UserRoleMode = UserRoleMode.Read;

  constructor(entity: IEntity) {
    super({});
    for (const key of Object.keys(entity)) {
      (this as any)[key] = (entity as any)[key];
    }
    
    this.entities = {};
  }

  async prepare(req: Request) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
  }
}
