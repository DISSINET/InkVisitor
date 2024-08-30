import { IEntity } from "@shared/types";
import {
  BadParams,
  CustomError,
  SearchEdgeTypesInvalid,
} from "@shared/types/errors";
import { Query } from "@shared/types/query";
import { Connection } from "rethinkdb-ts";
import { Results, SearchEdge, SearchNode } from ".";

export default class AdvancedSearch {
  root: SearchNode;

  constructor(data: Partial<Query.INode>) {
    this.root = new SearchNode(data);

    if (!this.root.type) {
      throw new BadParams();
    }
  }

  /**
   * Calls the whole search tree with additional validation
   * @param db Connection
   */
  async run(db: Connection): Promise<Results<IEntity>> {
    if (!this.root.isValid()) {
      throw new SearchEdgeTypesInvalid();
    }
    return await this.root.run(db);
  }

  /**
   * Shorthand for addEdge of root node
   * @param edgeData
   */
  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
