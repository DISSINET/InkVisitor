import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IResponseStatement,
  IResponseTerritory,
  ITerritory,
} from "@inkvisitor/shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Document from "@models/document/document";
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
      }

      if (useWarnings && !this.isTemplate) {
        // Each statement's getWarnings is an independent chain of DB
        // round-trips. Awaiting them one statement at a time serialized the
        // whole territory; rethinkdb-ts multiplexes concurrent queries over
        // the single per-request connection, so running them together
        // pipelines the work. Peak in-flight stays roughly the statement
        // count because each statement's own per-entity lookups remain
        // sequential internally. Statements are distinct instances with no
        // shared mutable state, so order of responseStatements is preserved.
        await Promise.all(
          responseStatements.map(async (responseStatement) => {
            responseStatement.warnings = await responseStatement.getWarnings(
              req,
              settings
            );
          })
        );
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

    // Batch-load document anchor spans in a single query for both the statement
    // rows (their own anchorTexts display field, used by the list Text column)
    // and any statement-class entities in the entities map (stamped for
    // EntityTag labels; see IEntity.anchorTexts). Only the preload path needs
    // this: prepareSync never fills usedInDocuments, so rows/map would stay
    // bare. The non-preload path already derives both per statement inside
    // ResponseStatement.prepare (anchorTexts from usedInDocuments, map via
    // prepareEntities' applyAnchorTexts) - re-running the batch there would be
    // pure duplicate work.
    if (usePreload) {
      const mapStatements = Object.values(this.entities).filter(
        (e) => !!e && e.class === EntityEnums.Class.Statement
      );
      const anchorTextsByStatement = await Document.getAnchorTextsForEntities(
        req.db.connection,
        [
          ...new Set([
            ...responseStatements.map((rs) => rs.id),
            ...mapStatements.map((e) => e.id),
          ]),
        ]
      );
      for (const rs of responseStatements) {
        const texts = anchorTextsByStatement[rs.id];
        if (texts && texts.length) {
          rs.anchorTexts = texts;
        }
      }
      for (const e of mapStatements) {
        const texts = anchorTextsByStatement[e.id];
        if (texts && texts.length) {
          e.anchorTexts = texts;
        }
      }
    }

    return responseStatements;
  }
}
