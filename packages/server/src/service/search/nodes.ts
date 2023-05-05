import { Search } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { SearchEdge } from ".";

export default class SearchNode implements Search.ISearchNode {
  type: Search.SearchNodeType;
  params: Search.ISearchNodeParams;
  operator: Search.SearchNodeOperator;
  edges: Search.ISearchEdge[];
  results: any;

  constructor(data: Partial<Search.ISearchNode>) {
    this.type = data.type || ("" as Search.SearchNodeType);
    this.params = data.params || {};
    this.operator = data.operator || Search.SearchNodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => new SearchEdge(edgeData))
      : [];
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchNode does not implement run method");
  }
}
