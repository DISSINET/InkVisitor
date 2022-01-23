import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import {
  IActant,
  IResponseActant,
  IResponseDetail,
  IStatement,
} from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Actant from ".";
import Statement from "@models/statement";

export class ResponseActant extends Actant implements IResponseActant {
  right: UserRoleMode = UserRoleMode.Read;

  constructor(actant: IActant) {
    super(actant);
  }

  async prepare(request: Request) {
    this.right = this.getUserRoleMode(request.getUserOrFail());
  }
}

export class ResponseActantDetail
  extends ResponseActant
  implements IResponseDetail
{
  entities: { [key: string]: IActant };
  usedInStatement?: IStatement[] | undefined;
  usedInStatementProps?: IStatement[] | undefined;

  constructor(actant: IActant) {
    super(actant);

    this.entities = {};
  }

  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    this.usedInStatement = await Statement.findDependentStatements(
      req.db.connection,
      this.id
    );

    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
  }
}
