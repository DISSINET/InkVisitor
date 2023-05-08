import {
  EntityDoesNotExist,
  SearchEdgeTypesInvalid,
} from "@shared/types/errors";
import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchNode } from ".";

export default class AdvancedSearch {
  root: SearchNode;
  results: any[] | null = null;

  constructor(data: Partial<Search.INode>) {
    this.root = new SearchNode(data);
  }

  async run(db: Connection): Promise<void> {
    if (!this.root.isValid()) {
      throw new SearchEdgeTypesInvalid();
    }
    this.results = await this.root.run(db);
  }

  addEdge(edgeData: Partial<Search.IEdge>): void {
    this.root.addEdge(edgeData);
  }
}
