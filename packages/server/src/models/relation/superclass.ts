import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";

export default class Superclass extends Relation implements RelationTypes.ISuperclass {
  type: RelationEnums.Type.Superclass;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Superclass;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    let prevClass: EntityEnums.Class | undefined;
    for (const entityId of this.entityIds) {
      const entity = this.entities?.find(e => e.id === entityId);
      if (!entity) {
        throw new InternalServerError('', `cannot check entity's class - not preloaded`);
      }

      if (!this.hasEntityCorrectClass(entityId, [EntityEnums.Class.Action, EntityEnums.Class.Concept])) {
        return new ModelNotValidError(`Entity '${entityId}' mush have class '${EntityEnums.Class.Action}' or '${EntityEnums.Class.Concept}'`);
      }
      if (prevClass === undefined) {
        prevClass = entity.class;
      }

      if (prevClass !== entity.class) {
        return new ModelNotValidError("Entities must have equal classes");
      }
    }

    return null;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    if (this.entityIds.length !== 2) {
      return false;
    }

    return true;
  }

  static async getSuperclassForwardConnections (
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.ISuperclass>[]> {
    const out: RelationTypes.IConnection<RelationTypes.ISuperclass>[] = [];
  
    if (nestLvl > maxNestLvl) {
      return out;
    }
  
    let relations: RelationTypes.IRelation[] = [];
  
    if (
      [EntityEnums.Class.Concept, EntityEnums.Class.Action].indexOf(asClass) !==
      -1
    ) {
      relations = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Superclass,
        0
      );
    } else if (EntityEnums.PLOGESTR.indexOf(asClass) !== -1) {
      relations = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Classification,
        0
      );
    }
  
    // sort by order
    relations.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );
  
    for (const relation of relations) {
      const subparentId = relation.entityIds[1];
      const connection: RelationTypes.IConnection<RelationTypes.ISuperclass> = {
        ...(relation as RelationTypes.ISuperclass),
        subtrees: [],
      };
  
      connection.subtrees = await Superclass.getSuperclassForwardConnections(
        conn,
        subparentId,
        EntityEnums.Class.Concept,
        maxNestLvl,
        nestLvl + 1
      );
      out.push(connection);
    }
  
    return out;
  };

  static async getSuperclassInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.ISuperclass[]> {
    let out: RelationTypes.ISuperclass[] = [];
  
    if (
      asClass === EntityEnums.Class.Action ||
      asClass === EntityEnums.Class.Concept
    ) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Superclass,
        1
      );
    }
  
    // sort by order
    out.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );
  
    return out;
  };
}
