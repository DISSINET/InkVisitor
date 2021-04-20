import { ActantType, IActant } from "./";
import { entityLogicalTypeDict } from "./../dictionaries";

type EntityClasses =
  | ActantType.Person
  | ActantType.Group
  | ActantType.Object
  | ActantType.Concept
  | ActantType.Location
  | ActantType.Value
  | ActantType.Event;

const entityLogicalTypeValues = entityLogicalTypeDict.map((i) => i.value);
export interface IEntity extends IActant {
  class: EntityClasses;
  data: {
    logicalType: typeof entityLogicalTypeValues[number];
  };
}
