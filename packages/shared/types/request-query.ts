import { Explore, Query } from "./query";

export interface IRequestQuery {
  query: Query.INode;
  explore: Explore.IExplore;
}
