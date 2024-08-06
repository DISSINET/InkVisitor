import { UsedRelations } from "@models/relation/relations";
import { RelationEnums } from "@shared/enums";
import { EntityTooltip, IEntity } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";

export class ResponseTooltip
  extends ResponseEntity
  implements EntityTooltip.IResponse
{
  entities: Record<string, IEntity> = {};

  relations: UsedRelations;

  constructor(entity: Entity) {
    super(entity);
    this.relations = new UsedRelations(entity.id, entity.class);
    this.relations.maxListLen = 10;
  }

  /**
   * Loads additional fields to satisfy the EntityTooltip.IResponse interface
   * @param request
   */
  async prepare(request: IRequest) {
    super.prepare(request);

    await this.relations.prepare(request, [
      RelationEnums.Type.Superclass,
      RelationEnums.Type.SuperordinateEntity,
      RelationEnums.Type.Synonym,
      RelationEnums.Type.ActionEventEquivalent,
      RelationEnums.Type.Classification,
      RelationEnums.Type.Identification,
      RelationEnums.Type.SubjectSemantics,
      RelationEnums.Type.Actant1Semantics,
      RelationEnums.Type.Actant2Semantics,
    ]);

    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Superclass)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(
        RelationEnums.Type.SuperordinateEntity
      )
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Synonym)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(
        RelationEnums.Type.ActionEventEquivalent
      )
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Classification)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Identification)
    );

    // semantics
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.SubjectSemantics)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Actant1Semantics)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Actant2Semantics)
    );

    this.entities = await this.populateEntitiesMap(request.db.connection);
  }
}
