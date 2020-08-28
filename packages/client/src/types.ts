export const Colors = [
  "black",
  "white",
  "primary",
  "warning",
  "danger",
  "info",
  "text",
  "grey",
  "entityT",
  "entityR",
  "entityA",
  "entityC",
  "entityE",
  "entityG",
  "entityL",
  "entityO",
  "entityP",
  "entityV",
];

export const Entities = {
  T: {
    id: "T",
    label: "Territory",
    color: "entityT",
  },
  R: {
    id: "R",
    label: "Territory",
    color: "entityR",
  },
  A: {
    id: "A",
    label: "Action",
    color: "entityA",
  },
  C: {
    id: "C",
    label: "Concept",
    color: "entityC",
  },
  E: {
    id: "E",
    label: "Event",
    color: "entityE",
  },
  G: {
    id: "G",
    label: "Group",
    color: "entityG",
  },
  L: {
    id: "L",
    label: "Location",
    color: "entityL",
  },
  O: {
    id: "O",
    label: "Object",
    color: "entityO",
  },
  P: {
    id: "P",
    label: "Person",
    color: "entityP",
  },
  V: {
    id: "V",
    label: "Value",
    color: "entityV",
  },
};

export type EntityKeys = keyof typeof Entities;

export interface TerritoriesTreeProps {
  expandedTreeId: string;
  selectedTreeId: string;
}

export interface Node {
  id: string;
  label: string;
  children: Array<Node>;
}

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
export interface TerritoryResponse extends Territory {
  children: Territory[];
  parent: false | Territory;
  statements: Statement[];
  actions: Action[];
  actants: Actant[];
}
