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

type IWarningWithDescription = {
  [key in WarningTypeEnums]: {
    label: string;
    description: string;
    editAllowed: boolean;
    section?: "valency" | "entity" | "territory";
  };
};

export const WarningsWithDescription: IWarningWithDescription = {
  SValency: {
    label: "Subject Valency",
    description: "",
    editAllowed: true,
  },
  A1Valency: {
    label: "Actant1 Valency",
    description: "",
    editAllowed: true,
  },
  A2Valency: {
    label: "Actant2 Valency",
    description: "",
    editAllowed: true,
  },
  NoTerritory: {
    label: "No Territory",
    description: "",
    editAllowed: false,
  },

  // Valency validations
  NA: {
    label: "No Action defined",
    description: "",
    editAllowed: false,
    section: "valency",
  },
  MA: {
    label: "Missing actant",
    description: "at least one actant of a matching type should be used",
    editAllowed: true,
    section: "valency",
  },
  WA: {
    label: "Actant’s entity type does not match the Action",
    description: "",
    editAllowed: true,
    section: "valency",
  },
  ANA: {
    label: "This actant position allows no actant",
    description: "",
    editAllowed: false,
    section: "valency",
  },
  WAC: {
    label: "Entity type valencies of the actions not matching",
    description: "",
    editAllowed: true,
    section: "valency",
  },
  AVU: {
    label: "Action valency not defined",
    description: "",
    editAllowed: true,
    section: "valency",
  },

  // Entity validations
  IELVL: {
    label: "Inconsistent Epistemic levels for the Property",
    description: "",
    editAllowed: false,
    section: "entity",
  },
  SCLM: {
    label: "Superclass missing",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  ISYNC: {
    label: "Inconsistent superclasses in the SYN cloud",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  MVAL: {
    label: "Missing at least one entity-type valency",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  AVAL: {
    label: "Asymmetrical valency",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  MAEE: {
    label: "Missing action/event equivalent",
    description: "",
    editAllowed: false,
    section: "entity",
  },
  PSM: {
    label: "Part of speech is empty",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  LM: {
    label: "Language is missing",
    description: "",
    editAllowed: true,
    section: "entity",
  },
  VETM: {
    label: "Empty valency for Action",
    description: "",
    editAllowed: true,
    section: "entity",
  },

  // T-based validations
  TVEP: {
    label: "Property missing",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVEPT: {
    label: "Property wrong type",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVEPV: {
    label: "Property wrong value",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVEC: {
    label: "Classification missing",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVECE: {
    label: "Classification wrong entity",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVER: {
    label: "Reference missing",
    description: "",
    editAllowed: true,
    section: "territory",
  },
  TVERE: {
    label: "Reference wrong entity",
    description: "",
    editAllowed: true,
    section: "territory",
  },
};

type WarningKey = keyof typeof WarningTypeEnums;

export const valencyKeys = Object.keys(WarningsWithDescription).filter(
  (key) => WarningsWithDescription[key as WarningKey].section === "valency"
) as WarningKey[];

export const entityKeys = Object.keys(WarningsWithDescription).filter(
  (key) => WarningsWithDescription[key as WarningKey].section === "entity"
) as WarningKey[];

export const territoryKeys = Object.keys(WarningsWithDescription).filter(
  (key) => WarningsWithDescription[key as WarningKey].section === "territory"
) as WarningKey[];
