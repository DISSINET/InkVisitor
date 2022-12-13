import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Superclass from "./superclass";
import { ModelNotValidError } from "@shared/types/errors";

export default class ActionEventEquivalent extends Relation implements RelationTypes.IActionEventEquivalent {
  type: RelationEnums.Type.ActionEventEquivalent;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IActionEventEquivalent>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.ActionEventEquivalent;
  }

  static async getActionEventEquivalentForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<
    RelationTypes.IConnection<RelationTypes.IActionEventEquivalent, RelationTypes.ISuperclass>[]> {
    const out: RelationTypes.IConnection<RelationTypes.IActionEventEquivalent, RelationTypes.ISuperclass>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IActionEventEquivalent[] = [];

    if (asClass === EntityEnums.Class.Action) {
      relations = await Relation.getForEntity(
        conn,
        entityId,
        RelationEnums.Type.ActionEventEquivalent,
        0
      );
    }

    for (const relation of relations) {
      const subparentId = relation.entityIds[1];
      const connection: RelationTypes.IConnection<
        RelationTypes.IActionEventEquivalent,
        RelationTypes.ISuperclass
      > = {
        ...relation,
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

  static async getActionEventEquivalentInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IActionEventEquivalent[]> {
    let out: RelationTypes.IActionEventEquivalent[] = [];

    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.ActionEventEquivalent,
        1
      );
    }

    return out;
  };

}