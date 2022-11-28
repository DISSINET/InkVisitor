import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Antonym extends Relation implements RelationTypes.IAntonym {
  type: RelationEnums.Type.Antonym;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IAntonym>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Antonym;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }
}