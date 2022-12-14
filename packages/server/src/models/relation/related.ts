import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Related extends Relation implements RelationTypes.IRelated {
  type: RelationEnums.Type.Related;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IRelated>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Related;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }
}