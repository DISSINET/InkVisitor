import { EntityEnums as Entities, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class Superclass
  extends Relation
  implements RelationTypes.ISuperclass
{
  type: RelationEnums.Type.Superclass;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.ISuperclass>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Superclass;
    this.order = data.order === undefined ? Entities.Order.Last : data.order;
  }

  static async getSuperclassForwardConnections(
    conn: Connection,
    parentId: string,
    asClass: Entities.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.ISuperclass>[]> {
    const out: RelationTypes.IConnection<RelationTypes.ISuperclass>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IRelation[] = [];

    if (
      Entities.IsClass(asClass, Entities.Class.Concept, Entities.Class.Action)
    ) {
      relations = await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.Superclass,
        0
      );
    } else if (Entities.IsPLOGESTR(asClass)) {
      relations = await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.Classification,
        0
      );
    }

    // sort by order
    relations.sort(
      (a, b) =>
        (a.order === undefined ? Entities.Order.Last : a.order) -
        (b.order === undefined ? Entities.Order.Last : b.order)
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
        Entities.Class.Concept,
        maxNestLvl,
        nestLvl + 1
      );
      out.push(connection);
    }

    return out;
  }

  static async getSuperclassInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: Entities.Class
  ): Promise<RelationTypes.ISuperclass[]> {
    let out: RelationTypes.ISuperclass[] = [];

    if (
      Entities.IsClass(asClass, Entities.Class.Action, Entities.Class.Concept)
    ) {
      out = await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.Superclass,
        1
      );
    }

    // sort by order
    out.sort(
      (a, b) =>
        (a.order === undefined ? Entities.Order.Last : a.order) -
        (b.order === undefined ? Entities.Order.Last : b.order)
    );

    return out;
  }
}
