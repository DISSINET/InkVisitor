import { IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IConcept } from "@shared/types";
import { IConceptData } from "@shared/types/concept";

class ConceptData implements IConceptData, IModel {
  pos: EntityEnums.ConceptPartOfSpeech = EntityEnums.ConceptPartOfSpeech.Empty;

  constructor(data: Partial<IConceptData>) {
    if (data.pos) {
      this.pos = data.pos;
    }
  }

  isValid(): boolean {
    return !!this.pos;
  }
}

class Concept extends Entity implements IConcept {
  class: EntityEnums.Class.Concept = EntityEnums.Class.Concept; // just default
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
