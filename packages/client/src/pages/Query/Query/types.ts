import { Query } from "@shared/types";

export const QUERY_GRID_WIDTH = 200;
export const QUERY_GRID_HEIGHT = 100;

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};
