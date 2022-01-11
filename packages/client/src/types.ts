import {
  ActantType,
  Certainty,
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Virtuality,
} from "@shared/enums";

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
  label: string;
  actantId: string;
}
export type DropdownItem = { value: string; label: string; info?: string };

export type SearchParams = {
  territory?: string;
  statement?: string;
  actant?: string;
};

// Attribute Editor
// TODO: delete what is not used
export type AttributeName =
  | "certainty"
  | "elvl"
  | "logic"
  | "mood"
  | "moodvariant"
  | "virtuality"
  | "partitivity"
  | "operator"
  | "bundleStart"
  | "bundleEnd";

export type GroupName = "type" | "value" | "statement";

export interface AttributeData {
  // id: string;
  certainty?: Certainty;
  elvl?: Elvl;
  logic?: Logic;
  mood?: Mood[];
  moodvariant?: MoodVariant;
  virtuality?: Virtuality;
  partitivity?: Partitivity;
  operator?: Operator;
  bundleStart?: boolean;
  bundleEnd?: boolean;
}
export interface AttributeGroupDataObject {
  statement: AttributeData;
  type: AttributeData;
  value: AttributeData;
}

export const classesPropType = [ActantType.Concept];
export const classesPropValue = [
  ActantType.Action,
  ActantType.Person,
  ActantType.Group,
  ActantType.Object,
  ActantType.Concept,
  ActantType.Location,
  ActantType.Value,
  ActantType.Event,
  ActantType.Statement,
  ActantType.Territory,
  ActantType.Resource,
];
