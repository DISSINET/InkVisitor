import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  EntityTooltip,
} from "@shared/types";
import { nonenumerable } from "@common/decorators";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom.request";
import { ResponseEntity } from "./response";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@shared/enums";
import { Relation as RelationTypes } from "@shared/types";

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

    const rootSuperclass = await this.getSuperclassTrees(request.db.connection, this.id, this.class);
    this.superclassTrees = rootSuperclass.subtrees;

    this.synonymCloud = await this.getSynonymCloud(request.db.connection)
    this.troponymCloud = await this.getTroponymCloud(request.db.connection)

    const superordinateTree = await this.getSuperordinateLocationTree(request.db.connection, this.id)
    this.superordinateLocationTrees = superordinateTree.subtrees;

    this.identifications = await this.getIdentifications(request.db.connection);

    this.entities = await this.populateEntitiesMap(request.db.connection)
  }

  /**
   * returns synonym cloud in the form of list containing grouped entity ids
   * @param conn 
   * @returns 
   */
  async getSynonymCloud(conn: Connection): Promise<EntityTooltip.ISynonymCloud | undefined> {
    if (this.class === EntityEnums.Class.Concept || this.class === EntityEnums.Class.Action) {
      const synonyms = await Relation.getForEntity<RelationTypes.ISynonym>(conn, this.id, RelationEnums.Type.Synonym);
      return synonyms.reduce((acc, cur) => acc.concat(cur.entityIds), [] as string[])
    }

    return undefined;
  }

  /**
   * returns troponym cloud in the form of list containing grouped entity ids
   * @param conn 
   * @returns 
   */
  async getTroponymCloud(conn: Connection): Promise<EntityTooltip.ISynonymCloud | undefined> {
    if (this.class === EntityEnums.Class.Action) {
      const troponyms = await Relation.getForEntity<RelationTypes.ITroponym>(conn, this.id, RelationEnums.Type.Troponym);
      return troponyms.reduce((acc, cur) => acc.concat(cur.entityIds), [] as string[])
    }

    return undefined;
  }

  /**
 * returns synonym cloud in the form of list containing grouped entity ids
 * @param conn 
 * @returns 
 */
  async getIdentifications(conn: Connection): Promise<EntityTooltip.IIdentification[]> {
    const out: EntityTooltip.IIdentification[] = [];
    const identifications = await Relation.getForEntity<RelationTypes.IIdentification>(conn, this.id, RelationEnums.Type.Identification);

    for (const relation of identifications) {
      out.push({
        certainty: relation.certainty,
        entityId: relation.entityIds[0] === this.id ? relation.entityIds[1] : relation.entityIds[0],
      })
    }

    return out
  }

  /**
   * recursively search for superordinate location relations
   * @param conn 
   */
  async getSuperordinateLocationTree(conn: Connection, parentId: string): Promise<EntityTooltip.ISuperordinateLocationTree> {
    const out: EntityTooltip.ISuperordinateLocationTree = {
      entityId: parentId,
      subtrees: [],
    }

    let locations: RelationTypes.ISuperordinateLocation[] = [];

    if (this.class === EntityEnums.Class.Location) {
      locations = await Relation.getForEntity<RelationTypes.ISuperordinateLocation>(conn, parentId, RelationEnums.Type.SuperordinateLocation, 0);
    }

    // make unique and sorted list of ids
    const subrootIds = [...new Set(locations.map(r => r.entityIds[1]))].sort();

    for (const subparentId of subrootIds) {
      out.subtrees.push(await this.getSuperordinateLocationTree(conn, subparentId))
    }

    // add ids to postponedEntities map
    for (const id of subrootIds) {
      this.postponedEntities[id] = undefined;
    }

    return out
  }

  /**
   * recursively search for superclass relations
   * @param conn 
   */
  async getSuperclassTrees(conn: Connection, parentId: string, asClass: EntityEnums.Class): Promise<EntityTooltip.ISuperclassTree> {
    const out: EntityTooltip.ISuperclassTree = {
      entityId: parentId,
      subtrees: [],
    }

    let relations: RelationTypes.IModel[] = [];

    switch (asClass) {
      case EntityEnums.Class.Concept, EntityEnums.Class.Action:
        relations = await Relation.getForEntity<RelationTypes.IModel>(conn, parentId, RelationEnums.Type.Superclass, 0);
        break;
      case EntityEnums.Class.Person, EntityEnums.Class.Location, EntityEnums.Class.Object,
        EntityEnums.Class.Group, EntityEnums.Class.Event, EntityEnums.Class.Statement,
        EntityEnums.Class.Territory, EntityEnums.Class.Resource:
        relations = await Relation.getForEntity<RelationTypes.IModel>(conn, parentId, RelationEnums.Type.Classification, 0);
        break;
      default:
        break;
    }

    // make unique and sorted list of ids
    const subrootIds = [...new Set(relations.map(r => r.entityIds[1]))].sort();

    for (const subparentId of subrootIds) {
      out.subtrees.push(await this.getSuperclassTrees(conn, subparentId, EntityEnums.Class.Concept))
    }

    // add ids to postponedEntities map
    for (const id of subrootIds) {
      this.postponedEntities[id] = undefined;
    }

    return out
  }
}
