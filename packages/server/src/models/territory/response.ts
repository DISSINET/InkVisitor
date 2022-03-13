import { Request } from "express";
import { UserRoleMode } from "@shared/enums";
import { IEntity, IResponseStatement, IResponseTerritory } from "@shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { findEntitiesById, findEntitiesByIds } from "@service/shorthands";

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

    const entitiesList = await findEntitiesById(
      req.db,
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
      const entities = await findEntitiesByIds(
        req.db,
        statement.data.actions.map((a) => a.action)
      );

      this.statements.push({
        ...statement,
        entities: Object.assign({}, ...entities.map((x) => ({ [x.id]: x }))),
      });
    }
  }
}
