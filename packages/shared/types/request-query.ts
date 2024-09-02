import { Explore, Query } from "./query";

export interface IRequestQuery extends Query.INode {
  query: Query.INode;
  explore: Explore.IExplore;
}
