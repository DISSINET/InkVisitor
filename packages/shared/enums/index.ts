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

export enum EntityLogicalType {
  Type1 = "1",
  Type2 = "2",
  Type3 = "3",
}

export enum ActantStatus {
  Status0 = "0",
  Status1 = "1",
  Status2 = "2",
  Status3 = "3",
}

export enum Certainty {
  Certainty0 = "0", // this is not used in dicts (@see ../disctionaries/certainty.ts)
  Certainty1 = "1",
  Certainty2 = "2",
  Certainty3 = "3",
  Certainty4 = "4",
  Certainty5 = "5",
  Certainty6 = "6",
}

export enum Elvl {
  Elvl1 = "1",
  Elvl2 = "2",
  Elvl3 = "3",
}

export enum Position {
  S = "s",
  A1 = "a1",
  A2 = "a2",
  P = "p",
}

export enum Logic {
  Logic1 = "1",
  Logic2 = "2",
}

export enum Mood {
  Mood1 = "1",
  Mood2 = "2",
  Mood3 = "3",
  Mood4 = "4",
  Mood5 = "5",
  Mood6 = "6",
  Mood7 = "7",
  Mood8 = "8",
  Mood9 = "9",
  Mood10 = "10",
  Mood11 = "11",
  Mood12 = "12",
  Mood13 = "13",
}

export enum MoodVariant {
  MoodVariant1 = "1",
  MoodVariant2 = "2",
  MoodVariant3 = "3",
}

export enum Virtuality {
  Virtuality1 = "1",
  Virtuality2 = "2",
  Virtuality3 = "3",
  Virtuality4 = "4",
  Virtuality5 = "5",
  Virtuality6 = "6",
}

export enum Partitivity {
  Partitivity1 = "1",
  Partitivity2 = "2",
  Partitivity3 = "3",
  Partitivity4 = "4",
  Partitivity5 = "5",
}

export enum Operator {
  OperatorX = "x",
  OperatorA = "a",
  OperatorO = "o",
  OperatorGt = ">",
  OperatorGeq = ">=",
  OperatorEq = "=",
  OperatorLeq = "<=",
  OperatorLt = "<",
}

export enum Language {
  Latin = "lat",
  English = "eng",
  MiddleEnglish = "enm",
  Occitan = "oci",
  Czech = "ces",
}

export enum ReferenceType {
  Primary = "1",
  Secondary = "2",
}

export enum ResourceType {
  Type1 = "1",
  Type2 = "2",
}

export enum TerritoryType {
  Type1 = "1",
  Type2 = "2",
}

export enum UserRoles {
  Admin = "admin",
  Editor = "editor",
  Viewer = "viewer",
}
