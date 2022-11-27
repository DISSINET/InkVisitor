import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Holonym extends Relation implements RelationTypes.IHolonym {
  type: RelationEnums.Type.Holonym;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IHolonym>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Holonym;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }
}