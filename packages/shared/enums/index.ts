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

// TODO: find a way how to turn imported list into enum
const statuses = ["0", "1", "2", "3"] as const;
export type ActantStatus = typeof statuses[number];

const logicalTypes = ["1", "2", "3"] as const;
export type ActantLogicalType = typeof logicalTypes[number];

const certanties = ["1", "2", "3", "4", "5", "6"] as const;
export type StatementCertainty = typeof certanties[number];

const elvls = ["1", "2", "3"] as const;
export type StatementElvls = typeof elvls[number];

const positions = ["s", "a1", "a2", "p"] as const;
export type StatementPositions = typeof positions[number];
