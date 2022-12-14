import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class SuperordinateLocation extends Relation implements RelationTypes.ISuperordinateLocation {
  type: RelationEnums.Type.SuperordinateLocation;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.ISuperordinateLocation>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SuperordinateLocation;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getSuperordinateLocationForwardConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.ISuperordinateLocation>[]> {
    const out: RelationTypes.IConnection<RelationTypes.ISuperordinateLocation>[] =
      [];
  
    if (nestLvl > maxNestLvl) {
      return out;
    }
  
    if (asClass === EntityEnums.Class.Location) {
      const relations: RelationTypes.ISuperordinateLocation[] =
        await Relation.getForEntity(
          conn,
          parentId,
          RelationEnums.Type.SuperordinateLocation,
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
        const connection: RelationTypes.IConnection<RelationTypes.ISuperordinateLocation> =
          {
            ...relation,
            subtrees: [],
          };
  
        connection.subtrees = await SuperordinateLocation.getSuperordinateLocationForwardConnections(
          conn,
          subparentId,
          asClass,
          maxNestLvl,
          nestLvl + 1
        );
  
        out.push(connection);
      }
    }
  
    return out;
  };
  
  static async getSuperordinateLocationInverseConnections (
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.ISuperordinateLocation[]> {
    let out: RelationTypes.ISuperordinateLocation[] = [];
  
    if (asClass === EntityEnums.Class.Location) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.SuperordinateLocation,
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