import {
  ISearchNode,
  ISearchEdge,
  SearchEdgeType,
  SearchNodeType,
  SearchNodeOperator,
  SearchEdgeLogic,
  ISearchNodeParams,
  ISearchEdgeParams,
} from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchNode } from ".";

export default class SearchEdge implements ISearchEdge {
  type: SearchEdgeType;
  params: ISearchEdgeParams;
  logic: SearchEdgeLogic;
  node?: SearchNode;

  constructor(data: Partial<ISearchEdge>) {
    this.type = data.type || ("" as SearchEdgeType);
    this.params = data.params || {};
    this.logic = data.logic || SearchEdgeLogic.POSITIVE;
    if (data.node) {
      this.node = new SearchNode(data.node);
    }
  }

  async run(db: Connection): Promise<void> {
    throw new Error("base SearchEdge does not implement run method");
  }
}
