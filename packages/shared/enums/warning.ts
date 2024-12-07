import { SettingsKey } from "@shared/types/settings";

export enum WarningTypeEnums {
  SValency = "SValency",
  A1Valency = "A1Valency",
  A2Valency = "A2Valency",
  NoTerritory = "NoTerritory",

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

const ValidationKeys = Object.keys(WarningTypeEnums).reduce((acc, key) => {
  const validationKey = `validation_${key}` as ValidationKey;
  acc[validationKey] = validationKey;
  return acc;
}, {} as Record<`validation_${keyof typeof WarningTypeEnums}`, string>);

export type ValidationKey = keyof typeof ValidationKeys;

type IWarningWithDescription = {
  [key in ValidationKey]: {
    label: string;
    description: string;
    editAllowed: boolean;
    section?: "valency" | "entity" | "territory";
  };
};

export const globalValidationsDict: IWarningWithDescription = {
  validation_SValency: {
    label: "Subject Valency",
    description: "",
    editAllowed: true,
  },
  validation_A1Valency: {
    label: "Actant1 Valency",
    description: "",
    editAllowed: true,
  },
  validation_A2Valency: {
    label: "Actant2 Valency",
    description: "",
    editAllowed: true,
  },
  validation_NoTerritory: {
    label: "No Territory",
    description: "",
    editAllowed: true,
  },
  // Valency validations
  validation_NA: {
    label: "No Action defined",
    description: "",
    editAllowed: true,
    section: "valency",
  },
  validation_MA: {
    label: "Missing actant",
    description: "At least one actant of a matching type should be used",
    editAllowed: true,
    section: "valency",
  },
  validation_WA: {
    label: "Actant not matches the Action",
    description: "Actant’s entity type does not match the Action",
    editAllowed: true,
    section: "valency",
  },
  validation_ANA: {
    label: "Position allows no actant",
    description: "",
    editAllowed: true,
    section: "valency",
  },
  validation_WAC: {
    label: "Action valencies not matching",
    description: "",
    editAllowed: true,
    section: "valency",
  },
  validation_AVU: {
    label: "Action valencies not defined",
    description: "",
    editAllowed: true,
    section: "valency",
  },

  // ???
  validation_IELVL: {
    label: "Inconsistent Epistemic levels for the Property",
    description: "",
    editAllowed: false,
    section: "entity",
  },
  // Entity validations
  validation_SCLM: {
    label: "Superclass missing",
    description:
      "There is at least one relation of type SCL which has the Entity at index 0",
    editAllowed: true,
    section: "entity",
  },
  validation_ISYNC: {
    label: "Inconsistent superclasses in the SYN cloud",
    description:
      "All Concepts in the SYN cloud (SYN Relation) have exactly the same SCL Relations.",
    editAllowed: false,
    section: "entity",
  },
  validation_MVAL: {
    label: "Missing at least one entity-type valency",
    description:
      "Every A needs to have at least one of the S slots (subject, actant1, actant2) entity type filled (the warning is active when all three are undefined) ",
    editAllowed: false,
    section: "entity",
  },
  validation_AVAL: {
    label: "Asymmetrical valency",
    description:
      "Checking symmetry between the three valency types: unless the only value in entity-type valency for the given slot is 'empty', then (a) morphosyntactic valency must be filled in (at least one character), (b) semantic valency of that slot (SUS, A1S, A2S - depending on the slot) must be set. Also the other way around: if there is non-empty morphosyntactic valency, then the other two types of valency (semantic valency and entity-type valency) must be filled in for the given slot. I.e., simply put: if any of the valencies is set and the only value is not 'empty' (this last condition applies of course to entity type valency only), the other two must be filled in also for that slot. Works also the other way: if the slot has entity-type valency empty only, then the grammatical and semantic valency must be empty.",
    editAllowed: false,
    section: "entity",
  },
  validation_VETM: {
    label: "Entity type not filled in for all valencies", // Empty valency for Action
    description:
      "User should explicitly use the 'empty' option, the list of allowed entity types should not be empty (length 0)",
    editAllowed: false,
    section: "entity",
  },
  validation_MAEE: {
    label: "Missing action/event equivalent",
    description: "To be valid, every A needs to have an AEE relation.",
    editAllowed: true,
    section: "entity",
  },
  validation_PSM: {
    label: "Missing part of speech attribute",
    description:
      "Value empty is assigned to the Part of Speech attribute of the Concept Entity",
    editAllowed: false,
    section: "entity",
  },
  validation_LM: {
    label: "Missing label language attribute",
    description: "Language attribute is empty.",
    editAllowed: false,
    section: "entity",
  },
  // T-based validations
  validation_TVEP: {
    label: "Entity should have a property",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  validation_TVEPT: {
    label: "Entity is missing a required property type", // wrong type
    description: "",
    editAllowed: true,
    section: "territory",
  },
  validation_TVEPV: {
    label: "Entity has a wrong property value",
    description:
      "Entity has a Prop with a correct type (according to the protocol), but the Prop value is either missing or wrong",
    editAllowed: true,
    section: "territory",
  },
  validation_TVEC: {
    label: "Entity should have a classification",
    description: "Any classification should be assigned to E",
    editAllowed: true,
    section: "territory",
  },
  validation_TVECE: {
    label: "Entity is  not classified to valid entity",
    description: "Entity does have a Classification but the entity is invalid",
    editAllowed: true,
    section: "territory",
  },
  validation_TVER: {
    label: "Entity should have a reference",
    description: "Any reference should be assigned to E",
    editAllowed: true,
    section: "territory",
  },
  validation_TVERE: {
    label: "Entity is not referenced to a valid entity",
    description: "Entity does have a Reference but the R entity is invalid",
    editAllowed: true,
    section: "territory",
  },
};

export type WarningKey = keyof typeof WarningTypeEnums;

export const valencyKeys = Object.keys(globalValidationsDict).filter(
  (key) => globalValidationsDict[key as ValidationKey].section === "valency"
) as ValidationKey[];

export const entityKeys = Object.keys(globalValidationsDict).filter(
  (key) => globalValidationsDict[key as ValidationKey].section === "entity"
) as ValidationKey[];

export const territoryKeys = Object.keys(globalValidationsDict).filter(
  (key) => globalValidationsDict[key as ValidationKey].section === "territory"
) as ValidationKey[];
