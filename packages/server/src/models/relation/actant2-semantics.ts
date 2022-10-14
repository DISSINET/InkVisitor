import { RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Actant2Semantics extends Relation implements RelationTypes.IActant2Semantics {
  type: RelationEnums.Type.Actant2Semantics;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IActant2Semantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Actant2Semantics;
  }
}
