import { UsedRelations } from "@models/relation/relations";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { EntityTooltip, IEntity } from "@inkvisitor/shared/types";
import { IResponseUsedInDocument } from "@inkvisitor/shared/types/response-detail";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";

export class ResponseTooltip
  extends ResponseEntity
  implements EntityTooltip.IResponse
{
  entities: Record<string, IEntity> = {};
  relations: UsedRelations;
  usedInDocuments: EntityTooltip.IUsedInDocument[] = [];

  constructor(entity: Entity) {
    super(entity);
    this.relations = new UsedRelations(entity.id, entity.class);
    // the tooltip renders only the entity's own (forward) connections
    this.relations.withInverse = false;
    this.usedInDocuments = [];
  }

  /**
   * Collapses anchors with the same (trimmed) text in the same document into
   * one entry with their count, in the order of first occurrence
   * @param uses one entry per anchor
   * @returns one entry per distinct document and anchor text
   */
  static groupUsedInDocuments(
    uses: IResponseUsedInDocument[]
  ): EntityTooltip.IUsedInDocument[] {
    const groups = new Map<string, EntityTooltip.IUsedInDocument>();
    for (const use of uses) {
      // every client surface trims anchor texts, so surrounding whitespace
      // does not make a text distinct
      const anchorText = use.anchorText.trim();
      const key = `${use.document.id}\u0000${anchorText}`;
      const group = groups.get(key);
      if (group) {
        group.count++;
      } else {
        groups.set(key, { document: use.document, anchorText, count: 1 });
      }
    }
    return [...groups.values()];
  }

  /**
   * Loads additional fields to satisfy the EntityTooltip.IResponse interface
   * @param request
   */
  async prepare(request: IRequest) {
    super.prepare(request);

    const conn = request.db.connection;

    // findUsedInDocuments only fills this.usedInDocuments - its results are
    // not fed into linkedEntitiesIds - so it is independent of the relations
    // walk and the populateEntitiesMap below. Overlap it with
    // relations.prepare instead of awaiting it sequentially (mirrors
    // ResponseEntityDetail.prepare). Pairing both in one Promise.all observes
    // either rejection without leaving a dangling promise.
    const [usedInDocuments] = await Promise.all([
      this.findUsedInDocuments(conn),
      this.relations.prepare(request, [
        RelationEnums.Type.Superclass,
        RelationEnums.Type.SuperordinateEntity,
        RelationEnums.Type.Synonym,
        RelationEnums.Type.ActionEventEquivalent,
        RelationEnums.Type.Classification,
        RelationEnums.Type.Identification,
        RelationEnums.Type.SubjectSemantics,
        RelationEnums.Type.Actant1Semantics,
        RelationEnums.Type.Actant2Semantics,
      ]),
    ]);

    this.usedInDocuments = ResponseTooltip.groupUsedInDocuments(usedInDocuments);

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

    // populateEntitiesMap depends on the fully-accumulated linkedEntitiesIds,
    // so it stays after every addLinkedEntities call above.
    this.entities = await this.populateEntitiesMap(conn);
  }
}
