import { Search } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { SearchEdge } from ".";

export default class SearchNode implements Search.INode {
  type: Search.NodeType;
  params: Search.INodeParams;
  operator: Search.NodeOperator;
  edges: Search.IEdge[];
  results: any;

  constructor(data: Partial<Search.INode>) {
    this.type = data.type || ("" as Search.NodeType);
    this.params = data.params || {};
    this.operator = data.operator || Search.NodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => new SearchEdge(edgeData))
      : [];
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchNode does not implement run method");
  }
}
