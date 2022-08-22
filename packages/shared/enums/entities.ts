
export enum EntityClass {
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

export enum EntityExtension {
    Any = "*",
    Empty = "X",
}

export type ExtendedEntityClass = EntityClass | EntityExtension;

export enum EntityLogicalType {
    Definite = "1",
    Indefinite = "2",
    Hypothetical = "3",
    Generic = "4",
}

export enum EntityStatus {
    Pending = "0",
    Approved = "1",
    Discouraged = "2",
    Warning = "3",
}

export enum Certainty {
    Empty = "0",
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
    PseudoActant = "pa",
}

export enum UsedInPosition {
    Value = "value",
    Type = "type",
    Actant = "actant",
    Action = "action",
    Tag = "tag",
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
    Italian = "ita",
    French = "fra",
    German = "deu",
}

export enum ResourceType {
    Type1 = "1",
    Type2 = "2",
}

export enum TerritoryType {
    Type1 = "1",
    Type2 = "2",
}

export enum Order {
    First = -9999,
    Last = 9999,
}