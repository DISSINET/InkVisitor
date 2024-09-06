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
import Entity from "@models/entity/entity";

export default class QuerySearch {
  static MAX_LIMIT = 100;
  static DEFAULT_LIMIT = 10;

  root: SearchNode;
  explore: Explore.IExplore;
  results: Results<IEntity> | null;

  constructor(query: Query.INode, explore: Explore.IExplore) {
    this.root = new SearchNode(query);
    this.explore = explore;
    if (this.explore.limit > QuerySearch.MAX_LIMIT) {
      this.explore.limit = QuerySearch.MAX_LIMIT;
    } else if (!this.explore.limit) {
      this.explore.limit = QuerySearch.DEFAULT_LIMIT;
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
  }

  /**
   * Calls the whole search tree with additional validation
   * @param db Connection
   */
  async run(db: Connection): Promise<string[]> {
    if (!this.root.isValid()) {
      throw new SearchEdgeTypesInvalid();
    }
    if (
      !this.root.edges.length &&
      !(this.root.params.classes || []).length &&
      !this.root.params.id &&
      !this.root.params.label
    ) {
      return [];
    }
    this.results = await this.root.run(db);
    return this.results.items || [];
  }

  async getResults(db: Connection): Promise<IResponseQueryEntity[]> {
    if (!this.results) {
      return [];
    }

    const filteredIds = this.results.filter(this.explore);
    console.log("fitlred", filteredIds.length);
    const filtered = await Entity.findEntitiesByIds(db, filteredIds);
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
