import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Implication extends Relation implements RelationTypes.IImplication {
  type: RelationEnums.Type.Implication;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IImplication>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Implication;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }
}