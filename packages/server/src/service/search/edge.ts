import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchNode } from ".";

export default class SearchEdge implements Search.IEdge {
  type: Search.EdgeType;
  params: Search.IEdgeParams;
  logic: Search.EdgeLogic;
  node?: SearchNode;

  constructor(data: Partial<Search.IEdge>) {
    this.type = data.type || ("" as Search.EdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Search.EdgeLogic.Positive;
    if (data.node) {
      this.node = new SearchNode(data.node);
    }
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchEdge does not implement run method");
  }
}
