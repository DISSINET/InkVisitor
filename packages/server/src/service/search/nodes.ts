import {
  ISearchNode,
  SearchNodeType,
  SearchNodeOperator,
  ISearchNodeParams,
  ISearchEdge,
} from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchEdge } from ".";

export default class SearchNode implements ISearchNode {
  type: SearchNodeType;
  params: ISearchNodeParams;
  operator: SearchNodeOperator;
  edges: ISearchEdge[];
  results: any;

  constructor(data: Partial<ISearchNode>) {
    this.type = data.type || ("" as SearchNodeType);
    this.params = data.params || {};
    this.operator = data.operator || SearchNodeOperator.AND;
    this.edges = data.edges
      ? data.edges.map((edgeData) => new SearchEdge(edgeData))
      : [];
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchNode does not implement run method");
  }
}
