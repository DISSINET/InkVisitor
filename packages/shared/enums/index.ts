export enum ActantType {
  Action = "A",
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
      ActantType.Action,
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
export type Certainty = typeof certanties[number];

const elvls = ["1", "2", "3"] as const;
export type Elvl = typeof elvls[number];

const positions = ["s", "a1", "a2", "p"] as const;
export type Position = typeof positions[number];

const logics = ["1", "2"] as const;
export type Logic = typeof logics[number];

const moods = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
] as const;
export type Mood = typeof moods[number];

const moodsvariants = ["1", "2", "3"] as const;
export type MoodVariant = typeof moodsvariants[number];

const virtualities = ["1", "2", "3"] as const;
export type Virtuality = typeof virtualities[number];

const partitivities = ["1", "2", "3", "4", "5"] as const;
export type Partitivity = typeof partitivities[number];
