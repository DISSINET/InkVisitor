import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import { IEntity, IResponseStatement, IResponseTerritory } from "@shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Entity from "@models/entity/entity";

export class ResponseTerritory extends Territory implements IResponseTerritory {
  statements: IResponseStatement[];
  entities: { [key: string]: IEntity };
  right: UserRoleMode = UserRoleMode.Read;

  constructor(entity: IEntity) {
    super({});
    for (const key of Object.keys(entity)) {
      (this as any)[key] = (entity as any)[key];
    }

    this.statements = [];
    this.entities = {};
  }

  async prepare(req: Request): Promise<void> {
    this.right = this.getUserRoleMode(req.getUserOrFail());

    const statements = await Statement.findStatementsInTerritory(
      req.db.connection,
      this.id
    );

    const entitiesList = await Entity.findEntitiesByIds(
      req.db.connection,
      Statement.getEntitiesIdsForMany(statements)
    );
    this.entities = entitiesList.reduce<{ [key: string]: IEntity }>(
      (acc, entity) => {
        acc[entity.id] = entity;
        return acc;
      },
      {}
    );

    for (const statement of statements) {
      const responseStatement = new ResponseStatement(new Statement(statement));
      await responseStatement.prepare(req);
      this.statements.push(responseStatement);
    }
  }
}
