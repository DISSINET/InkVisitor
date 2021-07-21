export enum ActantType {
  Territory = "T",
  Statement = "S",
  Resource = "R",
  Person = "P",
  Group = "G",
  Object = "O",
  Concept = "C",
  Location = "L",
  Value = "V",
  Event = "E",
}

export function isValidActantType(input: ActantType): boolean {
  return (
    [
      ActantType.Territory,
      ActantType.Statement,
      ActantType.Resource,
      ActantType.Person,
      ActantType.Group,
      ActantType.Object,
      ActantType.Concept,
      ActantType.Location,
      ActantType.Value,
      ActantType.Event,
    ].indexOf(input) !== -1
  );
}

export type CategoryActantType =
  | ActantType.Person
  | ActantType.Group
  | ActantType.Object
  | ActantType.Concept
  | ActantType.Location
  | ActantType.Value
  | ActantType.Event;

export type EntityActantType =
  | ActantType.Person
  | ActantType.Group
  | ActantType.Object
  | ActantType.Concept
  | ActantType.Location
  | ActantType.Value
  | ActantType.Event;
