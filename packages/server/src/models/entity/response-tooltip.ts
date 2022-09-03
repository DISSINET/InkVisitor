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
  synonymCloud?: EntityTooltip.ISynonymCloud;
  troponymCloud?: EntityTooltip.ITroponymCloud;
  superordinateLocationTrees: EntityTooltip.ISuperordinateLocationTree[] = [];
  identifications: EntityTooltip.IIdentifications = [];

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

    const rootSuperclass = await this.getSuperclasses(request.db.connection, this.id, this.class);
    this.superclassTrees = rootSuperclass.subtrees;

    this.entities = await this.populateEntitiesMap(request.db.connection)
  }

  /**
   * recursively search for superclasses
   * @param conn 
   */
  async getSuperclasses(conn: Connection, parentId: string, asClass: EntityEnums.Class): Promise<EntityTooltip.ISuperclassTree> {
    const out: EntityTooltip.ISuperclassTree = {
      rootId: parentId,
      subtrees: [],
    }

    let relations: Relation[] = [];

    switch (asClass) {
      case EntityEnums.Class.Concept, EntityEnums.Class.Action:
        relations = await Relation.getForEntity(conn, parentId, RelationEnums.Type.Superclass, 0);
        break;
      case EntityEnums.Class.Person, EntityEnums.Class.Location, EntityEnums.Class.Object,
        EntityEnums.Class.Group, EntityEnums.Class.Event, EntityEnums.Class.Statement,
        EntityEnums.Class.Territory, EntityEnums.Class.Resource:

        relations = await Relation.getForEntity(conn, parentId, RelationEnums.Type.Classification, 0);
        break;
      default:
        break;
    }

    // make unique and sorted list of ids
    const subrootIds = [...new Set(relations.map(r => r.entityIds[1]))].sort();

    for (const subparentId of subrootIds) {
      out.subtrees.push(await this.getSuperclasses(conn, subparentId, EntityEnums.Class.Concept))
    }

    // add ids to postponedEntities map
    for (const id of subrootIds) {
      this.postponedEntities[id] = undefined;
    }

    return out
  }
}
