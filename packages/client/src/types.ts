import {
  EntityStatus,
  EntityClass,
  Certainty,
  Elvl,
  EntityLogicalType,
  Language,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Virtuality,
  ExtendedEntityClass,
  EntityExtension,
} from "@shared/enums";
import { IEntity } from "@shared/types";

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

interface IEntityColor {
  entityClass: ExtendedEntityClass;
  color: typeof Colors[number];
}

// Use for colors, for dropdowns use entity.ts dictionary
export const EntityColors: { [key: string]: IEntityColor } = {
  T: {
    entityClass: EntityClass.Territory,
    color: "entityT",
  },
  R: {
    entityClass: EntityClass.Resource,
    color: "entityR",
  },
  A: {
    entityClass: EntityClass.Action,
    color: "entityA",
  },
  S: {
    entityClass: EntityClass.Statement,
    color: "entityS",
  },
  C: {
    entityClass: EntityClass.Concept,
    color: "entityC",
  },
  E: {
    entityClass: EntityClass.Event,
    color: "entityE",
  },
  G: {
    entityClass: EntityClass.Group,
    color: "entityG",
  },
  L: {
    entityClass: EntityClass.Location,
    color: "entityL",
  },
  O: {
    entityClass: EntityClass.Object,
    color: "entityO",
  },
  P: {
    entityClass: EntityClass.Person,
    color: "entityP",
  },
  V: {
    entityClass: EntityClass.Value,
    color: "entityV",
  },
  X: {
    entityClass: EntityExtension.Empty,
    color: "white",
  },
  all: {
    entityClass: EntityExtension.Any,
    color: "white",
  },
};

export type EntityKeys = keyof typeof EntityColors;

export interface Node {
  id: string;
  label: string;
  children: Array<Node>;
}
export enum ItemTypes {
  TAG = "TAG",
  STATEMENT_ROW = "STATEMENT_ROW",

  // should be removed
  ACTANT_ROW = "ACTANT_ROW",
  ENTITY_ROW = "ENTITY_ROW",
  ACTION_ROW = "ACTION_ROW",
  PROP_ROW = "PROP_ROW",
  PROP_ROW1 = "PROP_ROW1",
  PROP_ROW2 = "PROP_ROW2",
  PROP_ROW3 = "PROP_ROW3",
}

export type DragItem = {
  index: number;
  id: string;
  type: ItemTypes;
};
export interface EntityDragItem extends DragItem {
  entity: IEntity | false;
  entityClass: ExtendedEntityClass;
  isTemplate: boolean;
  isDiscouraged: boolean;
}
export interface DraggedTerritoryItem {
  index?: number;
  id?: string;
  parentId?: string;
  lvl?: number;
}
export enum DraggedPropRowCategory {
  ACTANT = "ACTANT",
  ACTION = "ACTION",
  META_PROP = "META_PROP",
}
export interface DraggedPropRowItem {
  index?: number;
  id?: string;
  parentId?: string;
  lvl?: number;
  category?: DraggedPropRowCategory;
}
export interface DraggedActantRowItem {
  category?: DraggedPropRowCategory;
}

export type ISearchPositionInStatement =
  | "any"
  | "action"
  | "actant"
  | "tag"
  | "reference"
  | "prop value"
  | "prop type";

export interface IRequestSearchEntity {
  class?: string; //izy
  label?: string; // regex, should also work from the middle...
  detail?: string; // also regex
  notes?: string; // is the text used within any note
  status?: EntityStatus; // izy
  language?: Language; //izy
  logicalType?: EntityLogicalType;
  hasProps?: IEntityHasProps[]; //this should be checked within meta props and within all statements where the entity is used as the prop origin
  usedInTerritories?: IEntityUsedInTerritory[]; // this is probably little bit complicated
  usedInStatements?: IEntityUsedInStatementWith[]; // and this is supposed to be complicated as well
}

interface IEntityHasProps {
  value?: string; // 'any' as default, otherwise this is the id of the actant that was used as the value within prop
  type?: string; // 'any' as default, id of the actat used as the type of the prop
  negative?: boolean; // false on default
  bundleOperator?: "and" | "or"; // and on default and may be implemented in 1.4.0
  bundleStart?: boolean; // false on default and may be implemented in 1.4.0
  bundleEnd?: boolean; // false on default and may be implemented in 1.4.0
}
interface IEntityUsedInTerritory {
  territoryId?: string;
  position?: ISearchPositionInStatement; // any as default, may be implemented in 1.4.0
  negative?: boolean; // false on default
  bundleOperator?: "and" | "or"; // and on default and may be implemented in 1.4.0
  bundleStart?: boolean; // false on default and may be implemented in 1.4.0
  bundleEnd?: boolean; // false on default and may be implemented in 1.4.0
}

interface IEntityUsedInStatementWith {
  entityPosition?: ISearchPositionInStatement; // position of the original entity within the statement
  withEntity?: string; // entity that is used within the same statement
  withEntityPosition?: ISearchPositionInStatement; // what is this "with" entity position? default any
  negative?: boolean; // false as default, should be within 1.3.0
  bundleOperator?: "and" | "or"; // and on default and may be implemented in 1.4.0
  bundleStart?: boolean; // false on default and may be implemented in 1.4.0
  bundleEnd?: boolean; // false on default and may be implemented in 1.4.0
}

export interface IRequestSearchStatement {
  text?: string; // izy
  author?: string; // is author of the statement the user with this id ?
  editor?: string; // is user id in any audit?
  note?: string; // is the text used within any note
  territory?: string; // check the whole tree to the root
  usedEntities?: IUsedEntityStatement[]; // see below
}

interface IUsedEntityStatement {
  entityId?: string;
  position?: ISearchPositionInStatement;
  negative?: boolean; // positive as default, should be within 1.3.0
  operator?: "and" | "or"; // and on default and may be implemented in 1.4.0
  bundleStart?: boolean; // false on default and may be implemented in 1.4.0
  bundleEnd?: boolean; // false on default and may be implemented in 1.4.0
}

export type DropdownItem = { value: string; label: string; info?: string };

export type SearchParams = {
  territory?: string;
  statement?: string;
  actant?: string;
};

// Attribute Editor
export type PropAttributeName =
  | "certainty"
  | "elvl"
  | "logic"
  | "mood"
  | "moodvariant"
  | "virtuality"
  | "partitivity"
  | "bundleOperator"
  | "bundleStart"
  | "bundleEnd";

export type PropAttributeGroup = "type" | "value" | "statement";

export type PropAttributeFilter = {
  [key in PropAttributeGroup]: PropAttributeName[];
};

export interface AttributeData {
  // id: string;
  certainty?: Certainty;
  elvl?: Elvl;
  logic?: Logic;
  mood?: Mood[];
  moodvariant?: MoodVariant;
  virtuality?: Virtuality;
  partitivity?: Partitivity;
  bundleOperator?: Operator;
  bundleStart?: boolean;
  bundleEnd?: boolean;
}
export interface PropAttributeGroupDataObject {
  statement: AttributeData;
  type: AttributeData;
  value: AttributeData;
}

export const classesPropType = [EntityClass.Concept];
export const classesPropValue = [
  EntityClass.Action,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
  EntityClass.Statement,
  EntityClass.Territory,
  EntityClass.Resource,
];

export interface EntitySuggestion {
  entity: IEntity;
  icons?: React.ReactNode[];
}
export interface SuggesterItemToCreate {
  label: string;
  entityClass: EntityClass;
  detail?: string;
  territoryId?: string;
}
