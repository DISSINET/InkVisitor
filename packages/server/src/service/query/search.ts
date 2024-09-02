import { IEntity } from "@shared/types";
import {
  BadParams,
  CustomError,
  SearchEdgeTypesInvalid,
} from "@shared/types/errors";
import { Explore, Query } from "@shared/types/query";
import { Connection } from "rethinkdb-ts";
import { Results, SearchEdge, SearchNode } from ".";
import { IResponseQueryEntity } from "@shared/types/response-query";

export default class AdvancedSearch {
  static MAX_LIMIT = 100;
  static DEFAULT_LIMIT = 10;

  root: SearchNode;
  explore: Explore.IExplore;
  results: Results<IEntity> | null;

  constructor(query: Query.INode, explore: Explore.IExplore) {
    this.root = new SearchNode(query);
    this.explore = explore;
    if (this.explore.limit > AdvancedSearch.MAX_LIMIT) {
      this.explore.limit = AdvancedSearch.MAX_LIMIT;
    } else if (!this.explore.limit) {
      this.explore.limit = AdvancedSearch.DEFAULT_LIMIT;
    }

    if (!this.explore.offset) {
      this.explore.offset = 0;
    } else if (this.explore.offset < 0) {
      this.explore.offset = 0;
    }

    if (!this.explore.columns) {
      this.explore.columns = [];
    }
    this.results = null;

    if (!this.root.type) {
      throw new BadParams();
    }

    if (
      !this.root.edges.length &&
      !(this.root.params.classes || []).length &&
      !this.root.params.id &&
      !this.root.params.label
    ) {
      throw new BadParams("Too loose conditions");
    }
  }

  /**
   * Calls the whole search tree with additional validation
   * @param db Connection
   */
  async run(db: Connection): Promise<IEntity[]> {
    if (!this.root.isValid()) {
      throw new SearchEdgeTypesInvalid();
    }
    this.results = await this.root.run(db);
    return this.results.items || [];
  }

  getResults(): IResponseQueryEntity[] {
    if (!this.results) {
      return [];
    }

    const filtered = this.results.filter(this.explore);
    return filtered.map((e) => ({
      entity: e,
      columnData: this.results!.columns(e, this.explore.columns),
    }));
  }

  /**
   * Shorthand for addEdge of root node
   * @param edgeData
   */
  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
