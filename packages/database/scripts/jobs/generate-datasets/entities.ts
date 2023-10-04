import {  IEntity } from "@shared/types";
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
import { EntityEnums } from "@shared/enums";
import { getRandomNumber } from "./utils";

export default class EntitiesGenerator {
  totalSize: number = 0; // at least 10

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

  getNextId(): string {
    return Math.random().toString(); //fix with uuid
  }

  generate() {
    let remainingSize = this.totalSize
    const maxAllocatableSize = this.totalSize / 4

    const territoriesSize = Math.ceil(remainingSize / 10)
    this.generateTerritories(territoriesSize)
    remainingSize -= territoriesSize

    const actionsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateActions(actionsSize)
    remainingSize -= actionsSize

    const statementsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateStatements(statementsSize)
    remainingSize -= statementsSize

    const resourcesSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateResources(resourcesSize)
    remainingSize -= resourcesSize

    const personsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generatePersons(personsSize)
    remainingSize -= personsSize

    const beingsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateBeings(beingsSize)
    remainingSize -= beingsSize

    const groupsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateGroups(groupsSize)
    remainingSize -= groupsSize

    const objectsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateObjects(objectsSize)
    remainingSize -= objectsSize

    const conceptsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateConcepts(conceptsSize)
    remainingSize -= conceptsSize

    const locationsSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
    this.generateLocations(locationsSize)
    remainingSize -= locationsSize

    const valuesSize = getRandomNumber(0, Math.min(maxAllocatableSize, remainingSize * 0.5))
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
}
