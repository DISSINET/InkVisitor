import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

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
}