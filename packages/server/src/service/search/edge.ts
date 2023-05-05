import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchNode } from ".";

export default class SearchEdge implements Search.ISearchEdge {
  type: Search.SearchEdgeType;
  params: Search.ISearchEdgeParams;
  logic: Search.SearchEdgeLogic;
  node?: SearchNode;

  constructor(data: Partial<Search.ISearchEdge>) {
    this.type = data.type || ("" as Search.SearchEdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Search.SearchEdgeLogic.Positive;
    if (data.node) {
      this.node = new SearchNode(data.node);
    }
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchEdge does not implement run method");
  }
}
