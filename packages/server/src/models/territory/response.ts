import { UserEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IResponseStatement,
  IResponseTerritory,
  ITerritory,
} from "@inkvisitor/shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { findEntityById } from "@service/shorthands";
import { Setting } from "@models/setting/setting";

export class ResponseTerritory extends Territory implements IResponseTerritory {
  statements: IResponseStatement[];
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: ITerritory) {
    super(entity);
    this.statements = [];
    this.entities = {};
  }

  async prepare(
    req: IRequest,
    usePreload: boolean = false,
    useWarnings: boolean = false
  ): Promise<void> {
    this.right = this.getUserRoleMode(req.getUserOrFail());

    this.statements = await this.prepareStatements(
      req,
      usePreload,
      useWarnings
    );
  }

  async prepareStatements(
    req: IRequest,
    usePreload: boolean = false,
    useWarnings: boolean = false
  ): Promise<ResponseStatement[]> {
    const statements = await Statement.findStatementsInTerritory(
      req.db.connection,
      this.id
    );

    // Settings drive the warnings paths below - fetch once per request so
    // every per-statement getWarnings call reuses the same array instead of
    // re-hitting the cache (or the DB on a cache miss) N times.
    const needsSettings = useWarnings || !usePreload;
    const settings = needsSettings
      ? await Setting.getSettingsAll(req.db.connection)
      : undefined;

    const responseStatements: ResponseStatement[] = [];

    if (usePreload) {
      // prepare all entity ids required for statements
      const preloadedEntities: Record<string, IEntity | undefined> = {};

      // Add parent territory entity ID if it exists
      if (this.data.parent) {
        preloadedEntities[this.data.parent.territoryId] = undefined;
      }

      for (const statement of statements) {
        const responseStatement = new ResponseStatement(
          new Statement(statement)
        );
        responseStatements.push(responseStatement);

        for (const entityId of responseStatement.getEntitiesIds()) {
          preloadedEntities[entityId] = undefined;
        }
      }

      // fetch all entities required for statements
      for (const entity of await Entity.findEntitiesByIds(
        req.db.connection,
        Object.keys(preloadedEntities)
      )) {
        preloadedEntities[entity.id] = entity;
      }

      this.entities = preloadedEntities as { [key: string]: IEntity };

      for (const responseStatement of responseStatements) {
        responseStatement.prepareSync(
          req,
          preloadedEntities as Record<string, IEntity>
        );
        if (useWarnings && !this.isTemplate) {
          responseStatement.warnings = await responseStatement.getWarnings(req, settings);
        }
      }
    } else {
      // Add parent territory entity if it exists
      if (this.data.parent) {
        const parentEntity = await findEntityById(
          req.db.connection,
          this.data.parent.territoryId
        );
        if (parentEntity) {
          this.entities[this.data.parent.territoryId] = parentEntity;
        }
      }

      for (const statement of statements) {
        const responseStatement = new ResponseStatement(
          new Statement(statement)
        );
        await responseStatement.prepare(req, settings);

        for (const entityId of Object.keys(responseStatement.entities)) {
          this.entities[entityId] = responseStatement.entities[entityId];
        }

        responseStatements.push(responseStatement);
      }
    }

    return responseStatements;
  }
}
