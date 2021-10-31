import { IDbModel, UnknownObject } from "./common";
import { ActantType } from "@shared/enums";
import Territory from "./territory";
import Statement from "./statement";
import Entity from "./entity";
import Resource from "./resource";
import { ModelNotValidError } from "@shared/types/errors";
import Action from "./action";
import Actant from "./actant";
import Concept from "./concept";

export function getActantType(data: UnknownObject): Actant {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new ModelNotValidError("bad input data for factory");
  }

  switch (data.class as ActantType) {
    case ActantType.Territory:
      return new Territory(data);
    case ActantType.Statement:
      return new Statement(data);
    case ActantType.Person:
      return new Entity(data);
    case ActantType.Group:
      return new Entity(data);
    case ActantType.Object:
      return new Entity(data);
    case ActantType.Concept:
      return new Concept(data);
    case ActantType.Location:
      return new Entity(data);
    case ActantType.Value:
      return new Entity(data);
    case ActantType.Event:
      return new Entity(data);
    case ActantType.Resource:
      return new Resource(data);
    case ActantType.Action:
      return new Action(data);
    default:
      throw new ModelNotValidError("unknown class");
  }
}
