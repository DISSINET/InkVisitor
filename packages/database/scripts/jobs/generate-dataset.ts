import { IAction, IAudit, IConcept, IEntity, IProp, IStatement, Relation as RelationTypes } from "@shared/types";
import { r, Connection, RDatum, } from "rethinkdb-ts";
import { IJob } from ".";
import { question } from "scripts/import/prompts";
import * as fs from "fs"
import * as path from "path"
import Action from "@models/action/action"
import Territory from "@models/territory/territory"
import Statement from "@models/statement/statement"
import Resource from "@models/resource/resource"
import Person from "@models/person/person"
import Being from "@models/being/being"
import Group from "@models/group/group"
import ObjectEntity from "@models/object/object"
import Concept from "@models/concept/concept"
import Location from "@models/location/location"
import Value from "@models/value/value"
import Event from "@models/event/event"
import Superclass from "@models/relation/superclass"
import SuperordinateLocation from "@models/relation/superordinate-location"
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
import { IRelationModel } from "@models/relation/relation";

function getRandomElements<T>(arr: T[], numberOfItems: number): T[] {
  if (arr.length < 2) {
    throw new Error("Array must contain at least two elements");
  }

  const randomIndexes: any[] = [];
  while (randomIndexes.length < numberOfItems) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!randomIndexes.includes(randomIndex)) {
      randomIndexes.push(randomIndex);
    }
  }

  return [arr[randomIndexes[0]], arr[randomIndexes[1]]];
}

function getRandomNumber(min: number, max: number): number {
  return Math.ceil(Math.random() * max )  + min
}

class Generator {
  static DIRECTORY = "datasets"
  datasetName: string = "";
  entitiesSize: number = 0; // at least 10
  relationsSize: number = 0; // max half the size of entities

  entities: Record<EntityEnums.Class, IEntity[]> = {
    [EntityEnums.Class.Action]: [],
    [EntityEnums.Class.Territory]: [],
    [EntityEnums.Class.Statement]: [],
    [EntityEnums.Class.Resource]: [],
    [EntityEnums.Class.Person]: [],
    [EntityEnums.Class.Being]: [],
    [EntityEnums.Class.Group]: [],
    [EntityEnums.Class.Object]: [],
    [EntityEnums.Class.Concept]: [],
    [EntityEnums.Class.Location]: [],
    [EntityEnums.Class.Value]: [],
    [EntityEnums.Class.Event]: [],
  };

  relations: Record<RelationEnums.Type, RelationTypes.IRelation[]> = {
    [RelationEnums.Type.Superclass]: [],
    [RelationEnums.Type.SuperordinateLocation]: [],
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

  constructor() {}

  getPath(filename?: string) {
    if (!this.datasetName) {
      throw new Error("Dataset name not yet set, cannot create the path to directory")
    }

    let parts = [__dirname, "..", "..", Generator.DIRECTORY, this.datasetName]
    if (filename) {
      parts.push(filename)
    }
    return path.join.apply(undefined, parts)
  }

  async getUserInfo() {
   this.datasetName = await question<string>(
      "Name of the dataset?",
      (input: string): string => {
        return input;
      },
      ""
    );
    if (!this.datasetName) {
      throw new Error("Dataset name should not be empty")
    }
    const datasetPath = this.getPath()
    if(fs.existsSync(datasetPath)) {
      throw new Error(`The dataset path (${datasetPath}) already exists`)
    }

    this.entitiesSize = await question<number>(
      "Number of entities?",
      (input: string): number => {
        return parseInt(input) || 0
      },
      0
    );
    if (this.entitiesSize <= 0) {
      throw new Error("Entities size should be a positive number")
    }

    this.relationsSize = await question<number>(
      "Number of relations? (max half the size of entities)",
      (input: string): number => {
        return parseInt(input) || 0
      },
      0
    );
    if (this.relationsSize > this.entitiesSize / 2) {
      throw new Error("Relations size should not be more than size of entities")
    }
    if (this.relationsSize < 0) {
      throw new Error("Entities size should not be a negative number")
    }
  }

  getNextId(): string {
    return Math.random().toString(); //fix with uuid
  }

  async generate() {
    this.generateEntities()
    this.generateRelations()

  }

  generateEntities() {
    let remainingSize = this.entitiesSize

    const territoriesSize = Math.ceil(remainingSize / 10)
    this.generateTerritories(territoriesSize)
    remainingSize -= territoriesSize

    const actionsSize = getRandomNumber(0, remainingSize)
    this.generateActions(actionsSize)
    remainingSize -= actionsSize

    const statementsSize = getRandomNumber(0, remainingSize)
    this.generateStatements(statementsSize)
    remainingSize -= statementsSize

    const resourcesSize = getRandomNumber(0, remainingSize)
    this.generateResources(resourcesSize)
    remainingSize -= resourcesSize

    const personsSize = getRandomNumber(0, remainingSize)
    this.generatePersons(personsSize)
    remainingSize -= personsSize

    const beingsSize = getRandomNumber(0, remainingSize)
    this.generateBeings(beingsSize)
    remainingSize -= beingsSize

    const groupsSize = getRandomNumber(0, remainingSize)
    this.generateGroups(groupsSize)
    remainingSize -= groupsSize

    const objectsSize = getRandomNumber(0, remainingSize)
    this.generateObjects(objectsSize)
    remainingSize -= objectsSize

    const conceptsSize = getRandomNumber(0, remainingSize)
    this.generateConcepts(conceptsSize)
    remainingSize -= conceptsSize

    const locationsSize = getRandomNumber(0, remainingSize)
    this.generateLocations(locationsSize)
    remainingSize -= locationsSize

    const valuesSize = getRandomNumber(0, remainingSize)
    this.generateValues(valuesSize)
    remainingSize -= valuesSize

    const eventsSize = remainingSize
    this.generateEvents(eventsSize)
  }

  generateActions(actionsSize: number) {
    console.log(`Creating ${actionsSize} actions`)

    const actions = this.entities[EntityEnums.Class.Action]
    for (let i = 0; i < actionsSize; i++) {
      actions.push(new Action({
        id: this.getNextId(),
        class: EntityEnums.Class.Action,
        label: `Action ${i + 1}`,
      }));
    }
  }

  generateTerritories(territoriesSize: number) {
    console.log(`Creating ${territoriesSize} territories`)

    const territories = this.entities[EntityEnums.Class.Territory]
    for (let i = 0; i < territoriesSize; i++) {
      // root territory
      if (i === 0) {
        territories.push(new Territory({
          id: "T0", // fixed id for root
          class: EntityEnums.Class.Territory,
          label: "Territory root",
        }))
        continue
      }

      const parentTerritory = Math.ceil(Math.random() * territories.length) - 1 // random parent territory, indexed from 0

      territories.push(new Territory({
        id: this.getNextId(),
        class: EntityEnums.Class.Territory,
        label: `Territory ${i + 1}`,
        data: {
          parent: {
            order: -1,
            territoryId: territories[parentTerritory].id,
          }
        }
      }));
    }
  }

  generateStatements(statementsSize: number) {
    console.log(`Creating ${statementsSize} statements`)

    const territories = this.entities[EntityEnums.Class.Territory]

    const statements = this.entities[EntityEnums.Class.Statement]
    for (let i = 0; i < statementsSize; i++) {
      const territory = territories[Math.ceil(Math.random() * territories.length) - 1]
      statements.push(new Statement({
        id: this.getNextId(),
        class: EntityEnums.Class.Statement,
        label: `Statement ${i + 1}`,
        data: {
          territory: {
            order: -1,
            territoryId: territory.id,
          },
          actants: [],
          actions: [],
          tags: [],
          text: "",
        }
      }));
    }
  }

  generateResources(resourcesSize: number) {
    console.log(`Creating ${resourcesSize} resources`)

    const resources = this.entities[EntityEnums.Class.Resource]
    for (let i = 0; i < resourcesSize; i++) {
      resources.push(new Resource({
        id: this.getNextId(),
        class: EntityEnums.Class.Resource,
        label: `Resource ${i + 1}`,
      }));
    }
  }

  generatePersons(personsSize: number) {
    console.log(`Creating ${personsSize} persons`)

    const persons = this.entities[EntityEnums.Class.Person]
    for (let i = 0; i < personsSize; i++) {
      persons.push(new Person({
        id: this.getNextId(),
        class: EntityEnums.Class.Person,
        label: `Person ${i + 1}`,
      }));
    }
  }

  generateBeings(beingsSize: number) {
    console.log(`Creating ${beingsSize} beings`)

    const beings = this.entities[EntityEnums.Class.Being]
    for (let i = 0; i < beingsSize; i++) {
      beings.push(new Being({
        id: this.getNextId(),
        class: EntityEnums.Class.Being,
        label: `Being ${i + 1}`,
      }));
    }
  }

  generateGroups(groupsSize: number) {
    console.log(`Creating ${groupsSize} groups`)

    const groups = this.entities[EntityEnums.Class.Group]
    for (let i = 0; i < groupsSize; i++) {
      groups.push(new Group({
        id: this.getNextId(),
        class: EntityEnums.Class.Group,
        label: `Group ${i + 1}`,
      }));
    }
  }

  generateObjects(objectsSize: number) {
    console.log(`Creating ${objectsSize} objects`)

    const objects = this.entities[EntityEnums.Class.Object]
    for (let i = 0; i < objectsSize; i++) {
      objects.push(new ObjectEntity({
        id: this.getNextId(),
        class: EntityEnums.Class.Object,
        label: `Object ${i + 1}`,
      }));
    }
  }

  generateConcepts(conceptsSize: number) {
    console.log(`Creating ${conceptsSize} concepts`)

    const concepts = this.entities[EntityEnums.Class.Concept]
    for (let i = 0; i < conceptsSize; i++) {
      concepts.push(new Concept({
        id: this.getNextId(),
        class: EntityEnums.Class.Concept,
        label: `Concept ${i + 1}`,
      }));
    }
  }

  generateLocations(locationsSize: number) {
    console.log(`Creating ${locationsSize} locations`)

    const locations = this.entities[EntityEnums.Class.Location]
    for (let i = 0; i < locationsSize; i++) {
      locations.push(new Location({
        id: this.getNextId(),
        class: EntityEnums.Class.Location,
        label: `Location ${i + 1}`,
      }));
    }
  }

  generateValues(valuesSize: number) {
    console.log(`Creating ${valuesSize} values`)

    const values = this.entities[EntityEnums.Class.Value]
    for (let i = 0; i < valuesSize; i++) {
      values.push(new Value({
        id: this.getNextId(),
        class: EntityEnums.Class.Value,
        label: `Value ${i + 1}`,
      }));
    }
  }

  generateEvents(eventsSize: number) {
    console.log(`Creating ${eventsSize} events`)

    const events = this.entities[EntityEnums.Class.Event]
    for (let i = 0; i < eventsSize; i++) {
      events.push(new Event({
        id: this.getNextId(),
        class: EntityEnums.Class.Event,
        label: `Event ${i + 1}`,
      }));
    }
  }

  generateRelations() {
    let remainingSize = this.relationsSize

    const superclassesSize = getRandomNumber(0, remainingSize)
    this.generateSuperclasses(superclassesSize);
    remainingSize -= superclassesSize

    const superordinateLocationsSize = getRandomNumber(0, remainingSize)
    this.generateSuperordinateLocations(superordinateLocationsSize);
    remainingSize -= superordinateLocationsSize

    const synonymsSize = getRandomNumber(0, remainingSize)
    this.generateSynonyms(synonymsSize);
    remainingSize -= synonymsSize

    const antonymsSize = getRandomNumber(0, remainingSize)
    this.generateAntonyms(antonymsSize);
    remainingSize -= antonymsSize

    const holonymsSize = getRandomNumber(0, remainingSize)
    this.generateHolonyms(holonymsSize);
    remainingSize -= holonymsSize

    const propertyReciprocalsSize = getRandomNumber(0, remainingSize)
    this.generatePropertyReciprocals(propertyReciprocalsSize);
    remainingSize -= propertyReciprocalsSize

    const subjectActant1ReciprocalsSize = getRandomNumber(0, remainingSize)
    this.generateSubjectActant1Reciprocals(subjectActant1ReciprocalsSize);
    remainingSize -= subjectActant1ReciprocalsSize

    const classificationsSize = getRandomNumber(0, remainingSize)
    this.generateClassifications(classificationsSize);
    remainingSize -= classificationsSize

    const identificationsSize = getRandomNumber(0, remainingSize)
    this.generateIdentifications(identificationsSize);
    remainingSize -= identificationsSize

    const implicationsSize = getRandomNumber(0, remainingSize)
    this.generateImplications(implicationsSize);
    remainingSize -= implicationsSize

    const subjectSemanticsSize = getRandomNumber(0, remainingSize)
    this.generateSubjectSemantics(subjectSemanticsSize);
    remainingSize -= subjectSemanticsSize

    const actant1SemanticsSize = getRandomNumber(0, remainingSize)
    this.generateActant1Semantics(actant1SemanticsSize);
    remainingSize -= actant1SemanticsSize

    const actant2SemanticsSize = getRandomNumber(0, remainingSize)
    this.generateActant2Semantics(actant2SemanticsSize);
    remainingSize -= actant2SemanticsSize

    const relatedSize = remainingSize
    this.generateRelated(relatedSize);
  }

  generateSuperclasses(relSize: number) {
    console.log(`Creating ${relSize} superclasses`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Superclass]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Superclass({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Superclass({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSuperordinateLocations(relSize: number) {
    console.log(`Creating ${relSize} superordinate locations`)

    const rels = this.relations[RelationEnums.Type.SuperordinateLocation]
    const locations = this.entities[EntityEnums.Class.Location]

    for (let i = 0; i < relSize; i++) {
      rels.push(new SuperordinateLocation({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(locations, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSynonyms(relSize: number) {
    console.log(`Creating ${relSize} synonyms`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Synonym]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Synonym({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Synonym({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateAntonyms(relSize: number) {
    console.log(`Creating ${relSize} antonyms`)

    const aaEntitiesSize = Math.ceil(relSize / 2)
    const ccEntitiesSize = relSize - aaEntitiesSize

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Antonym]

    for (let i = 0; i < aaEntitiesSize; i++) {
      rels.push(new Antonym({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
    for (let i = 0; i < ccEntitiesSize; i++) {
      rels.push(new Antonym({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateHolonyms(relSize: number) {
    console.log(`Creating ${relSize} holonyms`)

    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Holonym]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Holonym({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generatePropertyReciprocals(relSize: number) {
    console.log(`Creating ${relSize} property reciprocals`)

    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.PropertyReciprocal]

    for (let i = 0; i < relSize; i++) {
      rels.push(new PropertyReciprocal({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSubjectActant1Reciprocals(relSize: number) {
    console.log(`Creating ${relSize} subject actant 1 reciprocals`)

    const actions = this.entities[EntityEnums.Class.Action]
    const rels = this.relations[RelationEnums.Type.SubjectActant1Reciprocal]

    for (let i = 0; i < relSize; i++) {
      rels.push(new SubjectActant1Reciprocal({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateClassifications(relSize: number) {
    console.log(`Creating ${relSize} classifications`)

    const persons = this.entities[EntityEnums.Class.Person]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Classification]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Classification({
        id: this.getNextId(),
        entityIds: [...getRandomElements<IEntity>(persons, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateIdentifications(relSize: number) {
    console.log(`Creating ${relSize} identifications`)

    const persons = this.entities[EntityEnums.Class.Person]
    const rels = this.relations[RelationEnums.Type.Identification]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Identification({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(persons, 2).map(e => e.id) as [string, string]
      }));
    }
  }

  generateImplications(relSize: number) {
    console.log(`Creating ${relSize} subject implications`)

    const actions = this.entities[EntityEnums.Class.Action]
    const rels = this.relations[RelationEnums.Type.Implication]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Implication({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(actions, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  generateSubjectSemantics(relSize: number) {
    console.log(`Creating ${relSize} subject semantics`)

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.SubjectSemantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new SubjectSemantics({
        id: this.getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateActant1Semantics(relSize: number) {
    console.log(`Creating ${relSize} actant 1 semantics`)

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Actant1Semantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Actant1Semantics({
        id: this.getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateActant2Semantics(relSize: number) {
    console.log(`Creating ${relSize} actant 2 semantics`)

    const actions = this.entities[EntityEnums.Class.Action]
    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Actant2Semantics]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Actant2Semantics({
        id: this.getNextId(),
        entityIds: [...getRandomElements<IEntity>(actions, 1).map(e => e.id) as [string], ...getRandomElements<IEntity>(concepts, 1).map(e => e.id) as [string]]
      }));
    }
  }

  generateRelated(relSize: number) {
    console.log(`Creating ${relSize} related`)

    const concepts = this.entities[EntityEnums.Class.Concept]
    const rels = this.relations[RelationEnums.Type.Related]

    for (let i = 0; i < relSize; i++) {
      rels.push(new Related({
        id: this.getNextId(),
        entityIds: getRandomElements<IEntity>(concepts, 2).map(e => e.id) as [string, string],
      }));
    }
  }

  output() {
    fs.mkdirSync(this.getPath())

    let allEntities: IEntity[] = []
    for (const entities of Object.values(this.entities)) {
      allEntities = allEntities.concat(entities)
    }
    fs.writeFileSync(this.getPath("entities.json"), JSON.stringify(allEntities, null, 4))

    let allRelations: RelationTypes.IRelation[] = []
    for (const relations of Object.values(this.relations)) {
      allRelations = allRelations.concat(relations)
    }

    fs.writeFileSync(this.getPath("relations.json"), JSON.stringify(allRelations, null, 4))
  }
}

const job = async (db: Connection) => {
  const generator = new Generator()
  await generator.getUserInfo()
  generator.generate()
  generator.output();
}

export default job
