import { Search } from "@shared/types/search";
import { Connection } from "rethinkdb-ts";
import { SearchNode } from ".";

export default class AdvancedSearch {
  root: SearchNode;
  results: any;

  constructor(data: Partial<Search.ISearchNode>) {
    this.root = new SearchNode(data);
  }

  async run(db: Connection): Promise<void> {
    this.results = await this.root.run(db);
  }
}
