import { IDbModel, UnknownObject } from "./common";
import { ActantType } from "@shared/enums";
import Territory from "./territory";
import Statement from "./statement";

export function getActantType(data: UnknownObject): IDbModel | null {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
  }

  switch (data.class as ActantType) {
    case ActantType.Territory:
      return new Territory(data);
    case ActantType.Statement:
      return new Statement(data);
    default:
      return null;
  }
}
