import { ActantType } from "@shared/enums";

export const Colors = [
  "black",
  "white",
  "grey",
  "primary",
  "success",
  "warning",
  "danger",
  "info",
  "text",
  "entityT",
  "entityR",
  "entityA",
  "entityS",
  "entityC",
  "entityE",
  "entityG",
  "entityL",
  "entityO",
  "entityP",
  "entityV",
];

interface IEntity {
  id: string;
  label: string;
  color: typeof Colors[number];
}

export const Entities: { [key: string]: IEntity } = {
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
  S: {
    id: "S",
    label: "Statement",
    color: "entityS",
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

export interface Node {
  id: string;
  label: string;
  children: Array<Node>;
}
export const ItemTypes = {
  TAG: "TAG",
  STATEMENT_ROW: "STATEMENT_ROW",
  ACTANT_ROW: "ACTANT_ROW",
};

export type DragItem = {
  index: number;
  id: string;
  type: string;
};
export interface DraggedTerritoryItem {
  id?: string;
  parentId?: string;
  lvl?: number;
  index?: number;
}
export interface IRequestSearch {
  class?: ActantType;
  label?: string;
  actantId?: string;
}
export type DropdownItem = { value: string; label: string };

export type SearchParams = {
  territory?: string;
  statement?: string;
  actant?: string;
};
