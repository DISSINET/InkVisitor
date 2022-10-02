import { UnknownObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IConcept } from "@shared/types";

class ConceptData implements IModel {
  constructor(data: Partial<ConceptData>) {
  }

  isValid(): boolean {
    return true;
  }
}

class Concept extends Entity implements IConcept {
  class: EntityEnums.Class.Concept = EntityEnums.Class.Concept;
  data: ConceptData;

  constructor(data: Partial<IConcept>) {
    super(data);
    this.data = new ConceptData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Concept) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Concept;
