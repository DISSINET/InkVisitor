import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  Relation as RelationTypes,
  IResponseDetail,
  IResponseEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
  IStatement,
  EntityTooltip,
} from "@shared/types";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { nonenumerable } from "@common/decorators";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom.request";
import { ResponseEntity } from "./response";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@shared/enums";

export class ResponseTooltip extends ResponseEntity implements EntityTooltip.IResponse {
  entities: Record<string, IEntity> = {};

  superclassTrees: EntityTooltip.ISuperclassTree[] = [];
  synonymClouds: EntityTooltip.ISynonymCloud[] = [];
  troponymClouds: EntityTooltip.ITroponymCloud[] = [];
  superordinateLocationTrees: EntityTooltip.ISuperordinateLocationTree[] = [];
  identifications: EntityTooltip.IIdentifications[] = [];

  // map of entity ids that should be populated in subsequent methods and used in fetching
  // real entities in populateEntitiesMap method
  @nonenumerable
  postponedEntities: Record<string, undefined> = {};

  /**
   * Loads additional fields to satisfy the EntityTooltip.IResponse interface
   * @param request
   */
  async prepare(request: IRequest) {
    super.prepare(request)

    await this.fillSuperclassTrees(request)

    this.entities = await this.populateEntitiesMap(request.db.connection)
  }

  /**
   * populates the superclassTrees field by searching in relations collection
   * @param request 
   */
  async fillSuperclassTrees(request: IRequest) {
    switch (this.class) {
      case EntityEnums.Class.Concept, EntityEnums.Class.Action:
        const sRoots = await Relation.getForEntity(request.db.connection, this.id, RelationEnums.Type.Superclass, 0);
        for (const root of sRoots) {
          const tree: EntityTooltip.ISuperclassTree = { [root.entityIds[1]]: [] };
          const childs = await Relation.getForEntity(request.db.connection, root.entityIds[1], RelationEnums.Type.Superclass, 0);

          // store sorted unique list of ids
          tree[root.entityIds[1]] = childs
            .reduce((acc: any, child: Relation) => {
              acc[child.entityIds[1]] = 1;
              return acc;
            }, {} as Record<string, undefined>).keys().sort();

          this.superclassTrees.push(tree);
        }
        break;
      case EntityEnums.Class.Person, EntityEnums.Class.Location, EntityEnums.Class.Object,
        EntityEnums.Class.Group, EntityEnums.Class.Event, EntityEnums.Class.Statement,
        EntityEnums.Class.Territory, EntityEnums.Class.Resource:
        const cRoots = await Relation.getForEntity(request.db.connection, this.id, RelationEnums.Type.Classification, 0);
        for (const root of cRoots) {
          const tree: EntityTooltip.ISuperclassTree = { [root.entityIds[1]]: [] };
          const childs = await Relation.getForEntity(request.db.connection, root.entityIds[1], RelationEnums.Type.Classification, 0);

          // store sorted unique list of ids
          tree[root.entityIds[1]] = childs
            .reduce((acc: any, child: Relation) => {
              acc[child.entityIds[1]] = 1;
              return acc;
            }, {} as Record<string, undefined>).keys().sort();

          this.superclassTrees.push(tree);
        }
        break;
    }

    // prepare entity Ids for entities map
    for (const root of this.superclassTrees) {
      for (const childKey in root) {
        this.postponedEntities[childKey] = undefined;
        for (const childVal of root[childKey]) {
          this.postponedEntities[childVal] = undefined;
        }
      }
    }
  }
}
