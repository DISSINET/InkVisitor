import { Query } from "@shared/types";

export const QUERY_GRID_WIDTH = 350;
export const QUERY_GRID_HEIGHT = 50;

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};

export const edgeTypesImplemented: Query.EdgeType[] = [
  Query.EdgeType.XHasPropType,
  Query.EdgeType.XHasClassification,
  Query.EdgeType.XHasRelation,
  Query.EdgeType.CHasSuperclass,
  Query.EdgeType.SUnderT,
];

export type QueryValidity = {
  isValid: boolean;
  problems: QueryValidityProblem[];
};
export type QueryValidityProblem = {
  source: string;
  text: string;
};
