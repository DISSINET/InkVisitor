import { IDbModel, UnknownObject } from "./common";
import { ActantType } from "@shared/enums";
import Territory from "./territory";
import Statement from "./statement";
import Entity from "./entity";
import Resource from "./resource";

export function getActantType(data: UnknownObject): IDbModel | null {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
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
      return new Entity(data);
    case ActantType.Location:
      return new Entity(data);
    case ActantType.Value:
      return new Entity(data);
    case ActantType.Event:
      return new Entity(data);
    case ActantType.Resource:
      return new Resource(data);
    default:
      return null;
  }
}
