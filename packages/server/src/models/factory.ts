import { UnknownObject } from "./common";
import { EntityEnums } from "@shared/enums";
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

  switch (data.class as EntityEnums.Class) {
    case EntityEnums.Class.Territory:
      return new Territory(data);
    case EntityEnums.Class.Statement:
      return new Statement(data);
    case EntityEnums.Class.Person:
      return new Person(data);
    case EntityEnums.Class.Group:
      return new Group(data);
    case EntityEnums.Class.Object:
      return new ObjectEntity(data);
    case EntityEnums.Class.Concept:
      return new Concept(data);
    case EntityEnums.Class.Location:
      return new Location(data);
    case EntityEnums.Class.Value:
      return new Value(data);
    case EntityEnums.Class.Event:
      return new Event(data);
    case EntityEnums.Class.Resource:
      return new Resource(data);
    case EntityEnums.Class.Action:
      return new Action(data);
    default:
      throw new ModelNotValidError("unknown class");
  }
}
