import { UserEnums } from "@shared/enums";
import {
  IEntity,
  IResponseStatement,
  IResponseTerritory,
  ITerritory,
} from "@shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";

export class ResponseTerritory extends Territory implements IResponseTerritory {
  statements: IResponseStatement[];
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: ITerritory) {
    super(entity);
    this.statements = [];
    this.entities = {};
  }

  async prepare(req: IRequest, usePreload: boolean = false, useWarnings: boolean = false): Promise<void> {
    this.right = this.getUserRoleMode(req.getUserOrFail());

    this.statements = await this.prepareStatements(req, usePreload, useWarnings);
  }

  async prepareStatements(req: IRequest, usePreload: boolean = false, useWarnings: boolean = false): Promise<ResponseStatement[]> {
    const statements = await Statement.findStatementsInTerritory(
      req.db.connection,
      this.id
    );

    const responseStatements: ResponseStatement[] = [];

    if (usePreload) {
      // prepare all entity ids required for statements
      const preloadedEntities: Record<string, IEntity | undefined> = {};
      for (const statement of statements) {
        const responseStatement = new ResponseStatement(new Statement(statement));
        responseStatements.push(responseStatement);

        for (const entityId of responseStatement.getEntitiesIds()) {
          preloadedEntities[entityId] = undefined;
        }
      }

      // fetch all entities required for statements
      for (const entity of await Entity.findEntitiesByIds(req.db.connection, Object.keys(preloadedEntities))) {
        preloadedEntities[entity.id] = entity;
      }

      this.entities = preloadedEntities as { [key: string]: IEntity };
      
      for (const responseStatement of responseStatements) {
        responseStatement.prepareSync(req, preloadedEntities as Record<string, IEntity>);
        if (useWarnings && !this.isTemplate) {
          responseStatement.warnings = await responseStatement.getWarnings(req);
        }
      }
    } else {
      for (const statement of statements) {
        const responseStatement = new ResponseStatement(new Statement(statement));
        await responseStatement.prepare(req);

        for (const entityId of Object.keys(responseStatement.entities)) {
          this.entities[entityId] = responseStatement.entities[entityId];
        }

        responseStatements.push(responseStatement);
      }
    }

    return responseStatements;
  }
}
