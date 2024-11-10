import { Query } from "@shared/types";

export const QUERY_GRID_WIDTH = 400;
export const QUERY_GRID_HEIGHT = 50;

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};

export const edgeTypesImplemented: Query.EdgeType[] = [
  Query.EdgeType["EP:T"],
  Query.EdgeType["R:"],
  Query.EdgeType["R:CLA"],
  Query.EdgeType["R:SCL"],
  Query.EdgeType["SUT:"],
];

export type QueryValidity = {
  isValid: boolean;
  problems: QueryValidityProblem[];
};
export type QueryValidityProblem = {
  source: string;
  text: string;
};
