import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class SuperordinateEntity
  extends Relation
  implements RelationTypes.ISuperordinateEntity
{
  type: RelationEnums.Type.SuperordinateEntity;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.ISuperordinateEntity>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SuperordinateEntity;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getSuperordinateEntityForwardConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.ISuperordinateEntity>[]> {
    const out: RelationTypes.IConnection<RelationTypes.ISuperordinateEntity>[] =
      [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    const relations: RelationTypes.ISuperordinateEntity[] =
      await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.SuperordinateEntity,
        0
      );

    // sort by order
    relations.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );

    for (const relation of relations) {
      const subparentId = relation.entityIds[1];
      const connection: RelationTypes.IConnection<RelationTypes.ISuperordinateEntity> =
        {
          ...relation,
          subtrees: [],
        };

      connection.subtrees =
        await SuperordinateEntity.getSuperordinateEntityForwardConnections(
          conn,
          subparentId,
          asClass,
          maxNestLvl,
          nestLvl + 1
        );

      out.push(connection);
    }

    return out;
  }

  static async getSuperordinateEntityInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.ISuperordinateEntity[]> {
    let out: RelationTypes.ISuperordinateEntity[] = [];

    out = await Relation.findForEntities(
      conn,
      [parentId],
      RelationEnums.Type.SuperordinateEntity,
      1
    );

    // sort by order
    out.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );

    return out;
  }
}
