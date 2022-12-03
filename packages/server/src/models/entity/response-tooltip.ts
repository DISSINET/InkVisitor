import { IEntity, EntityTooltip } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { ResponseEntity } from "./response";
import Entity from './entity';
import { getActionEventNodes, getEntityIdsFromTree, getIdentifications, getSuperclassTrees, getSuperordinateLocationTree, getSynonymCloud } from "@models/relation/functions";
import { UsedRelations } from "@models/relation/relations";

export class ResponseTooltip
  extends ResponseEntity
  implements EntityTooltip.IResponse {
  entities: Record<string, IEntity> = {};

  superclassTrees: EntityTooltip.ISuperclassTree[] = [];
  synonymCloud?: EntityTooltip.ISynonymCloud;
  superordinateLocationTrees: EntityTooltip.ISuperordinateLocationTree[] = [];
  identifications: EntityTooltip.IIdentifications = [];
  actionEventEquivalent: EntityTooltip.ActionEventNode = [];

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

    await this.relations.prepareAll(request);

    const rootActionEventEquivalent = await getActionEventNodes(
      request.db.connection,
      this.id,
      this.class
    );
    this.actionEventEquivalent = rootActionEventEquivalent.subtrees;
    this.addLinkedEntities(getEntityIdsFromTree(rootActionEventEquivalent));

    const rootSuperclass = await getSuperclassTrees(
      request.db.connection,
      this.id,
      this.class
    );
    this.superclassTrees = rootSuperclass.subtrees;
    this.addLinkedEntities(getEntityIdsFromTree(rootSuperclass));

    this.synonymCloud = await getSynonymCloud(request.db.connection, this.class, this.id);
    if (this.synonymCloud) {
      this.addLinkedEntities(this.synonymCloud);
    }

    const superordinateTree = await getSuperordinateLocationTree(
      request.db.connection,
      this.class,
      this.id
    );
    this.superordinateLocationTrees = superordinateTree.subtrees;
    this.addLinkedEntities(getEntityIdsFromTree(superordinateTree));

    this.identifications = await getIdentifications(request.db.connection, this.id);
    this.addLinkedEntities(this.identifications.map(i => i.entityId));

    this.entities = await this.populateEntitiesMap(request.db.connection);
  }
}
