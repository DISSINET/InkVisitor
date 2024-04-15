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
  AVU = "AVU", // Action valency not defined

  IELVL = "IELVL", // Inconsistent Epistemic levels for the Property
  SCLM = "SCLM", // Superclass missing
  ISYNC = "ISYNC", // Inconsistent superclasses in the synonym cloud
  MVAL = "MVAL", // Missing at least one entity-type valency
  AVAL = "AVAL", // Asymmetrical valency
  MAEE = "MAEE", // Missing action/event equivalent
  PSM = "PSM", // Part of speech is empty
  LM = "LM", // Language is missing
  VETM = "VETM", // Empty valency for Action

  // T-based validations
  TVEP = "TVEP", // Property missing
  TVEPT = "TVEPT", // Property wrong type
  TVEPV = "TVEPV", // Property wrong value
  TVEC = "TVEC", // Classification missing
  TVECE = "TVECE", // Classification wrong entity
  TVER = "TVER", // Reference missing
  TVERE = "TVERE", // Reference wrong entity
}
