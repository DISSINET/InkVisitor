import { IDbModel, UnknownObject } from "./common";
import { EntityClass } from "@shared/enums";
import Territory from "./territory/territory";
import Statement from "./statement/statement";
import Entity from "./entity/entity";
import Resource from "./resource/resource";
import { ModelNotValidError } from "@shared/types/errors";
import Action from "./action/action";
import Actant from "./actant/actant";
import Concept from "./concept/concept";

export function getEntityClass(data: UnknownObject): Actant {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new ModelNotValidError("bad input data for factory");
  }

  switch (data.class as EntityClass) {
    case EntityClass.Territory:
      return new Territory(data);
    case EntityClass.Statement:
      return new Statement(data);
    case EntityClass.Person:
      return new Entity(data);
    case EntityClass.Group:
      return new Entity(data);
    case EntityClass.Object:
      return new Entity(data);
    case EntityClass.Concept:
      return new Concept(data);
    case EntityClass.Location:
      return new Entity(data);
    case EntityClass.Value:
      return new Entity(data);
    case EntityClass.Event:
      return new Entity(data);
    case EntityClass.Resource:
      return new Resource(data);
    case EntityClass.Action:
      return new Action(data);
    default:
      throw new ModelNotValidError("unknown class");
  }
}
