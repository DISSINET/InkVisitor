import { Query } from "@shared/types";

export const QUERY_GRID_WIDTH = 300;
export const QUERY_GRID_HEIGHT = 50;

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};
