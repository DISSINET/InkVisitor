import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import {
  IEntity,
  IResponseDetail,
  IResponseEntity,
  IStatement,
} from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Entity from "./entity";
import Statement from "@models/statement/statement";

export class ResponseEntity extends Entity implements IResponseEntity {
  right: UserRoleMode = UserRoleMode.Read;

  constructor(entity: IEntity) {
    super({});
    for (const key of Object.keys(entity)) {
      (this as any)[key] = (entity as any)[key];
    }
  }

  async prepare(request: Request) {
    this.right = this.getUserRoleMode(request.getUserOrFail());
  }
}

export class ResponseEntityDetail
  extends ResponseEntity
  implements IResponseDetail
{
  entities: { [key: string]: IEntity };
  usedInStatement?: IStatement[] | undefined;
  usedInStatementProps?: IStatement[] | undefined;

  constructor(entity: IEntity) {
    super(entity);
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
