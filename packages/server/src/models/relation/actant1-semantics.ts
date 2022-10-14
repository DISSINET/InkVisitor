import { RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Actant1Semantics extends Relation implements RelationTypes.IActant1Semantics {
  type: RelationEnums.Type.Actant1Semantics;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IActant1Semantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Actant1Semantics;
  }
}
