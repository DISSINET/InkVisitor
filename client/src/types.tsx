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

export interface Statement {
  id: string;
  tree: object;
}
