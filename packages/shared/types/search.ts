export interface SearchNode {
  type: SearchNodeType;
  params: SearchNodeParams;
  operator: SearchNodeOperator;
  edges: SearchEdge[];
}

export interface SearchEdge {
  type: SearchEdgeType;
  params: SearchEdgeParams;
  logic: SearchEdgeLogic;
  node: SearchNode;
}

export interface SearchNodeParams {
  label: "string";
  id: "string";
}
export interface SearchEdgeParams {}

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
  HAS_STATEMENT = "has_statement",
}
export enum SearchNodeOperator {
  AND = "and",
  OR = "or",
}
export enum SearchEdgeLogic {
  POSITIVE = "positive",
  NEGATIVE = "negative",
}
