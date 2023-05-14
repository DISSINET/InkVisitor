import { IEntity } from "@shared/types";
import { SearchEdgeTypesInvalid } from "@shared/types/errors";
import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { Results, SearchEdge, SearchNode } from ".";

export default class AdvancedSearch {
  root: SearchNode;

  constructor(data: Partial<Search.INode>) {
    this.root = new SearchNode(data);
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
  addEdge(edgeData: Partial<Search.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
