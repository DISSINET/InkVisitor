import { Explore, Query } from "./query";

export interface IRequestQuery {
  query: Query.INode;
  explore: Explore.IExplore;
}
export interface IRequestQueryExport {
  query: Query.INode;
  explore: Explore.IExplore;
  rowIndices: number[];
}
