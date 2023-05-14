import { SearchEdgeTypesInvalid } from "@shared/types/errors";
import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchEdge, SearchNode } from ".";

export default class AdvancedSearch {
  root: SearchNode;
  results: any[] | null = null;

  constructor(data: Partial<Search.INode>) {
    this.root = new SearchNode(data);
  }

  /**
   * Calls the whole search tree with additional validation
   * @param db Connection
   */
  async run(db: Connection): Promise<void> {
    if (!this.root.isValid()) {
      throw new SearchEdgeTypesInvalid();
    }
    this.results = (await this.root.run(db)) as any;
  }

  /**
   * Shorthand for addEdge of root node
   * @param edgeData
   */
  addEdge(edgeData: Partial<Search.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
