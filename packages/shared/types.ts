export interface Action {
  id: string;
  parent: false | string;
  note: string;
  labels: { label: string; language: string }[];
  types: [];
  valencies: [];
  rulesActants: [];
  rulesProperties: [];
}
export interface Actant {
  id: string;
  class: "T" | "S" | "E" | "R";
  label: string;
  data: {};
}
export interface Entity extends Actant {
  class: "E";
  data: { type: "P" | "G" | "O" | "C" | "L" | "V" | "E" };
}
export interface Resource extends Actant {
  class: "R";
  data: {
    content: string;
    link: string;
    type: string;
    language: string;
  };
}

export interface Territory extends Actant {
  class: "T";
  data: {
    content: string;
    language: string;
    parent: string | false;
    type: string;
  };
}
export interface Statement extends Actant {
  class: "S";
  data: {
    action: string;
    territory: string;
    references: { resource: string; part: string; type: string }[];
    tags: string[];
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    props: {
      id: string;
      subject: string;
      actant1: string;
      actant2: string;
      elvl: string;
      certainty: string;
    }[];
    actants: {
      actant: string;
      position: string;
      elvl: string;
      certainty: string;
    }[];
  };
}

/**
 * type of the /territory endpoint response
 */
export interface TerritoryResponse extends Territory {
  children: Territory[];
  parent: false | Territory;
  statements: Statement[];
  actions: Action[];
  actants: Actant[];
}

/**
 * type of the /actant endpoint response
 * TODO
 */
export interface ActantResponse extends Actant {}

/**
 * type of the /meta endpoint response
 * TODO
 */
export interface MetaResponse {}
