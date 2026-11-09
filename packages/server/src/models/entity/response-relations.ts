import { UsedRelations } from "@models/relation/relations";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { IResponseEntityRelations } from "@inkvisitor/shared/types/response-detail";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";

export class ResponseEntityRelations extends ResponseEntity implements IResponseEntityRelations {
  entities: Record<string, IEntity> = {};
  relations: UsedRelations;

  constructor(entity: Entity) {
    super(entity);
    this.relations = new UsedRelations(entity.id, entity.class);
  }

  /**
   * Loads the relations of every type, as ResponseEntityDetail.prepare does, and the entities
   * they point to
   * @param request
   */
  async prepare(request: IRequest): Promise<void> {
    super.prepare(request);

    await this.relations.prepare(request, RelationEnums.AllTypes);
    for (const type of RelationEnums.AllTypes) {
      this.addLinkedEntities(this.relations.getEntityIdsFromType(type));
    }

    this.entities = await this.populateEntitiesMap(request.db.connection);
  }
}
