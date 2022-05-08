import { Request } from "express";
import { EntityClass } from "@shared/enums";
import { IEntity, IResponseSearch, RequestSearch } from "@shared/types";
import { regExpEscape } from "@common/functions";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { Connection, r, RDatum } from "rethinkdb-ts";
import { ResponseEntity } from "./response";
import { getEntityClass } from "@models/factory";

export async function filterEntitiesByWildcard(
  connection: Connection,
  entityClass: EntityClass | false,
  entityClassExcluded: EntityClass[] | undefined,
  entityLabel: string | false,
  entityIds?: string[],
  onlyTemplates?: boolean,
  usedTemplate?: string
): Promise<IEntity[]> {
  let query = r.table(Entity.table);

  if (entityIds && entityIds.length) {
    query = query.getAll(r.args(entityIds)) as any;
  }

  if (entityClass) {
    query = query.filter({
      class: entityClass,
    });
  }

  if (usedTemplate) {
    query = query.filter({
      usedTemplate: usedTemplate,
    });
  }

  if (onlyTemplates) {
    query = query.filter({
      isTemplate: true,
    });
  }

  if (entityClassExcluded) {
    query = query.filter(function (row: RDatum) {
      return r.and.apply(
        r,
        entityClassExcluded.map((c) => row("class").ne(c)) as [
          RDatum<boolean>,
          ...RDatum<boolean>[]
        ]
      );
    });
  }

  if (entityLabel) {
    let leftWildcard: string = "^",
      rightWildcard: string = "$";

    if (entityLabel[0] === "*") {
      leftWildcard = "";
      entityLabel = entityLabel.slice(1);
    }

    if (entityLabel[entityLabel.length - 1] === "*") {
      rightWildcard = "";
      entityLabel = entityLabel.slice(0, -1);
    }

    entityLabel = regExpEscape(entityLabel.toLowerCase());

    query = query.filter(function (row: RDatum) {
      return row("label")
        .downcase()
        .match(`${leftWildcard}${entityLabel}${rightWildcard}`);
    });
  }

  return query.run(connection);
}

export class ResponseSearch {
  request: RequestSearch;
  responses: IResponseSearch[];

  constructor(request: RequestSearch) {
    this.request = request;
    this.responses = [];
  }

  /**
   * Prepares asynchronously results data
   * @param db
   */
  async prepare(httpRequest: Request): Promise<void> {
    let associatedEntityIds: string[] | undefined = undefined;
    if (this.request.entityId) {
      associatedEntityIds = await Statement.findIdsByDataEntityId(
        httpRequest.db.connection,
        this.request.entityId
      );

      // entity id provided, but not found within statements - end now
      if (!associatedEntityIds.length) {
        return;
      }
    }

    // filter out duplicates
    associatedEntityIds = [...new Set(associatedEntityIds)];

    const entities = await filterEntitiesByWildcard(
      httpRequest.db.connection,
      this.request.class,
      this.request.excluded,
      this.request.label,
      associatedEntityIds,
      this.request.onlyTemplates,
      this.request.usedTemplate
    );

    for (const entityData of entities) {
      const response = new ResponseEntity(getEntityClass(entityData));
      await response.prepare(httpRequest);
      this.responses.push(response);
    }
  }

  /**
   *
   * @returns returns prepares list of search entities
   */
  getResults(): IResponseSearch[] {
    return this.responses;
  }
}
