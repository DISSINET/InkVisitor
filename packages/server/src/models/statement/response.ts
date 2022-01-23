import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import { IActant, IResponseStatement } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Statement from ".";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IActant };
  right: UserRoleMode = UserRoleMode.Read;

  constructor(actant: IActant) {
    super(actant);

    this.entities = {};
  }

  async prepare(req: Request) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
  }
}
