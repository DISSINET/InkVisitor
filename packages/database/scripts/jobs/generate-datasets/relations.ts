import { IEntity, Relation as RelationTypes } from "@shared/types";
import Superclass from "@models/relation/superclass"
import SuperordinateEntity from "@models/relation/superordinate-entity"
import Synonym from "@models/relation/synonym"
import Antonym from "@models/relation/antonym"
import Holonym  from "@models/relation/holonym"
import PropertyReciprocal from "@models/relation/property-reciprocal"
import SubjectActant1Reciprocal from "@models/relation/subject-actant1-reciprocal"
import Classification from "@models/relation/classification"
import Identification from "@models/relation/identification"
import Implication from "@models/relation/implication"
import SubjectSemantics from "@models/relation/subject-semantics"
import Actant1Semantics from "@models/relation/actant1-semantics"
import Actant2Semantics from "@models/relation/actant2-semantics"
import Related from "@models/relation/related"

import { EntityEnums, RelationEnums } from "@shared/enums";
import { getNextId, getRandomElements, getRandomNumber } from "./utils";

export default class RelationsGenerator {
  totalSize: number = 0; // max half the size of entities

  relations: Record<RelationEnums.Type, RelationTypes.IRelation[]> = {
    [RelationEnums.Type.Superclass]: [],
    [RelationEnums.Type.SuperordinateEntity]: [],
    [RelationEnums.Type.Synonym]: [],
    [RelationEnums.Type.Antonym]: [],
    [RelationEnums.Type.Holonym]: [],
    [RelationEnums.Type.PropertyReciprocal]: [],
    [RelationEnums.Type.SubjectActant1Reciprocal]: [],
    [RelationEnums.Type.ActionEventEquivalent]: [],
    [RelationEnums.Type.Classification]: [],
    [RelationEnums.Type.Identification]: [],
    [RelationEnums.Type.Implication]: [],
    [RelationEnums.Type.SubjectSemantics]: [],
    [RelationEnums.Type.Actant1Semantics]: [],
    [RelationEnums.Type.Actant2Semantics]: [],
    [RelationEnums.Type.Related]: [],
  };

  generate(entities: Record<EntityEnums.Class, IEntity[]>) {
    let remainingSize = this.totalSize
    const maxAllocatableSize = this.totalSize / 4

    const superclassesSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateSuperclasses(superclassesSize, entities);
    remainingSize -= superclassesSize

    const superordinateEntitiesSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateSuperordinateEntities(superordinateEntitiesSize, entities);
    remainingSize -= superordinateEntitiesSize

    const synonymsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateSynonyms(synonymsSize, entities);
    remainingSize -= synonymsSize

    const antonymsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateAntonyms(antonymsSize, entities);
    remainingSize -= antonymsSize

    const holonymsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateHolonyms(holonymsSize, entities);
    remainingSize -= holonymsSize

    const propertyReciprocalsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generatePropertyReciprocals(propertyReciprocalsSize, entities);
    remainingSize -= propertyReciprocalsSize

    const subjectActant1ReciprocalsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateSubjectActant1Reciprocals(subjectActant1ReciprocalsSize, entities);
    remainingSize -= subjectActant1ReciprocalsSize

    const classificationsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateClassifications(classificationsSize, entities);
    remainingSize -= classificationsSize

    const identificationsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateIdentifications(identificationsSize, entities);
    remainingSize -= identificationsSize

    const implicationsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateImplications(implicationsSize, entities);
    remainingSize -= implicationsSize

    const subjectSemanticsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateSubjectSemantics(subjectSemanticsSize, entities);
    remainingSize -= subjectSemanticsSize

    const actant1SemanticsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateActant1Semantics(actant1SemanticsSize, entities);
    remainingSize -= actant1SemanticsSize

    const actant2SemanticsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateActant2Semantics(actant2SemanticsSize, entities);
    remainingSize -= actant2SemanticsSize

    const relatedSize = remainingSize
    this.generateRelated(relatedSize, entities);
  }

  generateSuperclasses(relSize: number, entities: Record<EntityEnums.Class, IEntity[]> ) {
    console.log(`Creating ${relSize} superclasses`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Superclass]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Superclass({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Superclass({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSuperordinateEntities(relSize: number, entities: Record<EntityEnums.Class, IEntity[]> ) {
    console.log(`Creating ${relSize} superordinate entities`)

    const rels = this.relations[RelationEnums.Type.SuperordinateEntity]

    for (let i = 0; i < relSize; i++) {
      const classType = getRandomElements<EntityEnums.Class>([EntityEnums.Class.Location, EntityEnums.Class.Object, EntityEnums.Class.Event, EntityEnums.Class.Statement, EntityEnums.Class.Value, EntityEnums.Class.Being], 1)
      const entitiesContainer = entities[classType[0]]
      rels.push(new SuperordinateEntity({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(entitiesContainer, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSynonyms(relSize: number, entities: Record<EntityEnums.Class, IEntity[]> ) {
    console.log(`Creating ${relSize} synonyms`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Synonym]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Synonym({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Synonym({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateAntonyms(relSize: number, entities: Record<EntityEnums.Class, IEntity[]> ) {
    console.log(`Creating ${relSize} antonyms`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Antonym]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Antonym({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Antonym({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateHolonyms(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} holonyms`)

    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Holonym]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Holonym({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generatePropertyReciprocals(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} property reciprocals`)

    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.PropertyReciprocal]

    for (let i = 0; i < relSize; i++) {
      rels.push(new PropertyReciprocal({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSubjectActant1Reciprocals(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} subject actant 1 reciprocals`)

    const actions = entities[EntityEnums.Class.Action]
    const rels = this.relations[RelationEnums.Type.SubjectActant1Reciprocal]

    for (let i = 0; i < relSize; i++) {
      rels.push(new SubjectActant1Reciprocal({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateClassifications(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} classifications`)

    const persons = entities[EntityEnums.Class.Person]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Classification]

    for (let i = 0; i < relSize; i++) {
      const randomPersons = getRandomElements<IEntity>(persons, 1);
      const randomConcepts = getRandomElements<IEntity>(concepts, 1)
      rels.push(new Classification({
        id: getNextId(),
        entityIds: [
          ...randomPersons.map(e => e.id) as [string],
          ...randomConcepts.map(e => e.id) as [string]
        ]
      }));
    }
  }

  generateIdentifications(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} identifications`)

    const persons = entities[EntityEnums.Class.Person]
    const rels = this.relations[RelationEnums.Type.Identification]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Identification({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(persons, 2).map(e => e.id) as [string, string]
      }));
    }
  }

  generateImplications(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} subject implications`)

    const actions = entities[EntityEnums.Class.Action]
    const rels = this.relations[RelationEnums.Type.Implication]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Implication({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSubjectSemantics(relSize: number,entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} subject semantics`)

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.SubjectSemantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new SubjectSemantics({
        id: getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateActant1Semantics(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} actant 1 semantics`)

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Actant1Semantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Actant1Semantics({
        id: getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateActant2Semantics(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} actant 2 semantics`)

    const actions = entities[EntityEnums.Class.Action]
    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Actant2Semantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Actant2Semantics({
        id: getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateRelated(relSize: number, entities: Record<EntityEnums.Class, IEntity[]>) {
    console.log(`Creating ${relSize} related`)

    const concepts = entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Related]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Related({
        id: getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }
}
