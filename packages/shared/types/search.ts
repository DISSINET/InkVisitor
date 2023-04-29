import { EntityEnums } from "./../enums";

export interface ISearchNode {
  type: SearchNodeType;
  params: ISearchNodeParams;
  operator: SearchNodeOperator;
  edges: ISearchEdge[];
}

export interface ISearchEdge {
  type: SearchEdgeType;
  params: ISearchEdgeParams;
  logic: SearchEdgeLogic;
  node: ISearchNode;
}

export interface ISearchNodeParams {
  class?: EntityEnums.Class;
  label?: "string";
  id?: "string";
}
export interface ISearchEdgeParams {}

export enum SearchNodeType {
  X = "Entity",
  C = "Concept",
  A = "Action",
  S = "Statement",
  R = "Resource",
}
export enum SearchEdgeType {
  HAS_PROPTYPE = "has_proptype",
  HAS_PROPVALUE = "has_propvalue",
  HAS_SUPERCLASS = "has_superclass",
  HAS_CLASSIFICATIOn = "has_classification",
  HAS_ACTANT = "has actant",
  IS_ACTANT = "is actant",
  HAS_STATEMENT = "has_statement",
  IS_IN_STATEMENT = "is_in_statement",
}
export enum SearchNodeOperator {
  AND = "and",
  OR = "or",
}
export enum SearchEdgeLogic {
  POSITIVE = "positive",
  NEGATIVE = "negative",
}
