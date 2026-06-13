import { Query } from "@inkvisitor/shared/types";

export const QUERY_GRID_WIDTH = 400;
export const QUERY_GRID_HEIGHT = 50;

export const QUERY_LEFT_PANEL_MIN_WIDTH = 600;
export const QUERY_RIGHT_PANEL_MIN_WIDTH = 450;
export const QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION = 60;
export const QUERY_SEARCH_PANEL_MIN_HEIGHT = 34;

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};

export const edgeTypesImplemented: Query.EdgeType[] = [
  Query.EdgeType["EP:T"],
  Query.EdgeType["HP:V"],
  Query.EdgeType["SP:T"],
  Query.EdgeType["SP:V"],
  // inverse in-statement edges: match the entity characterised by an
  // in-statement prop/classification (server: getEdgeInstance in edge.ts)
  Query.EdgeType["I_SP:T"],
  Query.EdgeType["I_SP:V"],
  Query.EdgeType["I_SC"],
  Query.EdgeType["HR:R"],
  Query.EdgeType["HR:V"],
  Query.EdgeType["R:"],
  Query.EdgeType["R:CLA"],
  Query.EdgeType["R:SCL"],
  Query.EdgeType["R:SOE"],
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
