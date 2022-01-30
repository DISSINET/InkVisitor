export enum ActantType {
  Any = "*",
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

export type AllActantType =
  | ActantType.Action
  | ActantType.Territory
  | ActantType.Statement
  | ActantType.Resource
  | ActantType.Person
  | ActantType.Group
  | ActantType.Object
  | ActantType.Concept
  | ActantType.Location
  | ActantType.Value
  | ActantType.Event;

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
  | ActantType.Location
  | ActantType.Value
  | ActantType.Event;

export enum EntityLogicalType {
  Definite = "1",
  Indefinite = "2",
  Hypothetical = "3",
  Generic = "4",
}

export enum ActantStatus {
  Pending = "0",
  Approved = "1",
  Discouraged = "2",
  Warning = "3",
}

export enum Certainty {
  Empty = "0", // this is not used in dicts (@see ../disctionaries/certainty.ts)
  Certain = "1",
  AlmostCertain = "2",
  Probable = "3",
  Possible = "4",
  Dubious = "5",
  False = "6",
}

export enum Elvl {
  Textual = "1",
  Interpretive = "2",
  Inferential = "3",
}

export enum Position {
  Subject = "s",
  Actant1 = "a1",
  Actant2 = "a2",
  PseudoActant = "p",
}

export enum Logic {
  Positive = "1",
  Negative = "2",
}

export enum Mood {
  Indication = "1",
  Question = "2",
  Condition = "3",
  Possibility = "4",
  Probability = "5",
  Certitude = "6",
  Wish = "7",
  Order = "8",
  Licence = "9",
  Ability = "10",
  Belief = "11",
  Allegation = "12",
  Semblance = "13",
}

export enum MoodVariant {
  Realis = "1",
  Irrealis = "2",
  ToBeDecided = "3",
}

export enum Virtuality {
  Reality = "1",
  Possibility = "2",
  Probability = "3",
  Certitude = "4",
  Allegation = "5",
  Semblance = "6",
}

export enum Partitivity {
  Unison = "1",
  UnisonOrParts = "2",
  UnisonOrDiscreteParts = "3",
  Parts = "4",
  DiscreteParts = "5",
}

export enum Operator {
  Xor = "x",
  And = "a",
  Or = "o",
  Greater = ">",
  GreaterOrEqual = ">=",
  Equal = "=",
  LessOrEqual = "<=",
  Less = "<",
}

export enum Language {
  Empty = "",
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

export enum UserRole {
  Admin = "admin",
  Editor = "editor",
  Viewer = "viewer",
}

export enum UserRoleMode {
  Write = "write",
  Read = "read",
  Admin = "admin",
}

export enum Order {
  First = -9999,
  Last = 9999,
}
