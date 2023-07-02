import { IWarning } from "@shared/types";

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
}

export function getWarningMessage({ type, position }: IWarning): string {
  switch (type) {
    case WarningTypeEnums.SValency:
      return "Subject Valency";
    case WarningTypeEnums.A1Valency:
      return "Actant1 Valency";
    case WarningTypeEnums.A2Valency:
      return "Actant2 Valency";
    case WarningTypeEnums.NoTerritory:
      return "No Territory";
    case WarningTypeEnums.NA:
      return "No Action defined";
    case WarningTypeEnums.MA:
      return "Missing actant: at least one actant of a matching type should be used";
    case WarningTypeEnums.WA:
      return "Actant’s entity type does not match the Action";
    case WarningTypeEnums.ANA:
      return "This actant position allows no actant";
    case WarningTypeEnums.WAC:
      return "Entity type valencies of the actions not matching";
    case WarningTypeEnums.AVU:
      return "Action valency not defined";
    case WarningTypeEnums.IELVL:
      return "Inconsistent Epistemic levels for the Property";
    case WarningTypeEnums.SCLM:
      return "Superclass missing";
    case WarningTypeEnums.ISYNC:
      return "Inconsistent superclasses in the synonym cloud";
    case WarningTypeEnums.MVAL:
      return "Missing at least one entity-type valency";
    case WarningTypeEnums.AVAL:
      return "Asymmetrical valency";
    case WarningTypeEnums.MAEE:
      return "Missing action/event equivalent";
    default:
      return "";
  }
}
