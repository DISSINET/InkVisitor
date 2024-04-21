import { IDocument, IResponseDocument } from "@shared/types";
import Document from "./document";
import { IRequest } from "src/custom_typings/request";
import Entity from "@models/entity/entity";
import { findEntityById } from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import { Connection } from "rethinkdb-ts";

export default class ResponseDocument
  extends Document
  implements IResponseDocument
{
  referencedEntityIds: Record<EntityEnums.Class, string[]>;
  entityIds: string[];

  constructor(data: Partial<IDocument>) {
    super(data);
    this.entityIds = this.findEntities();

    // add all EntityEnums.Class to referencedEntityIds
    const referencedEntityIds: Record<EntityEnums.Class, string[]> =
      {} as Record<EntityEnums.Class, string[]>;

    for (const entityClass of Object.values(EntityEnums.Class)) {
      referencedEntityIds[entityClass as EntityEnums.Class] = [];
    }
    this.referencedEntityIds = referencedEntityIds;
  }

  findEntities(): string[] {
    const regex = /<([\w-]+)>/g;
    let match;

    const entities = [];

    while ((match = regex.exec(this.content)) !== null) {
      entities.push(match[1]);
    }

    const uEntities = [...new Set(entities)];

    return uEntities;
  }

  async populateWithEntities(conn: Connection): Promise<void> {
    for (const entityId of this.entityIds) {
      const entity = await findEntityById(conn, entityId);

      if (entity) {
        const entityClass = entity.class;
        if (entityClass) {
          this.referencedEntityIds[entityClass].push(entity.id);
        }
      }
    }
  }
}
