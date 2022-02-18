import { UnknownObject } from "./common";
import { EntityClass } from "@shared/enums";
import Territory from "./territory/territory";
import Statement from "./statement/statement";
import Resource from "./resource/resource";
import { ModelNotValidError } from "@shared/types/errors";
import Action from "./action/action";
import Entity from "./entity/entity";
import Concept from "./concept/concept";
import Person from "./person/person";
import Group from "./group/group";
import ObjectEntity from "./object/object";
import Location from "./location/location";
import Value from "./value/value";
import Event from "./event/event";

export function getEntityClass(data: UnknownObject): Entity {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new ModelNotValidError("bad input data for factory");
  }

  switch (data.class as EntityClass) {
    case EntityClass.Territory:
      return new Territory(data);
    case EntityClass.Statement:
      return new Statement(data);
    case EntityClass.Person:
      return new Person(data);
    case EntityClass.Group:
      return new Group(data);
    case EntityClass.Object:
      return new ObjectEntity(data);
    case EntityClass.Concept:
      return new Concept(data);
    case EntityClass.Location:
      return new Location(data);
    case EntityClass.Value:
      return new Value(data);
    case EntityClass.Event:
      return new Event(data);
    case EntityClass.Resource:
      return new Resource(data);
    case EntityClass.Action:
      return new Action(data);
    default:
      throw new ModelNotValidError("unknown class");
  }
}
