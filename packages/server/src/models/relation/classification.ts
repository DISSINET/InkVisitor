import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Classification extends Relation implements RelationTypes.IClassification {
  type: RelationEnums.Type.Classification;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IClassification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Classification;
    this.order = data.order || EntityEnums.Order.Last;
  }
}