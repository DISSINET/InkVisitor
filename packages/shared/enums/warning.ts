export enum WarningTypeEnums {
  SValency = "Subject Valency",
  A1Valency = "Actant1 Valency",
  A2Valency = "Actant2 Valency",
  NoTerritory = "No Territory",
  NA = "NA", // "No Action defined",
  MA = "MA", // "Missing actant: at least one actant of a matching type should be used",
  WA = "WA", // "Actant’s entity type does not match the Action",
  ANA = "ANA", // "This actant position allows no actant",
  WAC = "WAC", // "Entity type valencies of the actions not matching",
  AVU = "AVU" // Action valency not defined
}
