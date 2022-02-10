import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import {
  IActant,
  IAction,
  IEntity,
  IResource,
  IResponseActant,
  IResponseDetail,
  IStatement,
  ITerritory,
} from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Actant from "./actant";
import Statement from "@models/statement/statement";

export class ResponseActant extends Actant implements IResponseActant {
  right: UserRoleMode = UserRoleMode.Read;

  constructor(actant: IActant) {
    super({});
    for (const key of Object.keys(actant)) {
      (this as any)[key] = (actant as any)[key];
    }
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
  usedInStatement: string[];
  usedInStatementProps: string[];

  constructor(actant: IActant) {
    super(actant);
    this.entities = {};
    this.usedInStatement = [];
    this.usedInStatementProps = [];
  }

  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    const usedInStatement = await Statement.findUsed(
      req.db.connection,
      this.id
    );

    const usedInStatementProps = await Statement.findUsedInProps(
      req.db.connection,
      this.id
    );

    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));

    for (const statement of usedInStatement) {
      this.entities[statement.id] = statement;
    }
    for (const statement of usedInStatementProps) {
      this.entities[statement.id] = statement;
    }

    this.usedInStatement = usedInStatement.map((s) => s.id);
    this.usedInStatementProps = usedInStatementProps.map((s) => s.id);
  }
}
