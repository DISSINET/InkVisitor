import { IEntity } from "@inkvisitor/shared/types";
import {
  BadParams,
  CustomError,
  SearchEdgeTypesInvalid,
} from "@inkvisitor/shared/types/errors";
import { Explore, Query } from "@inkvisitor/shared/types/query";
import { Connection } from "rethinkdb-ts";
import { Results, SearchEdge, SearchNode } from ".";
import { IResponseQueryEntity } from "@inkvisitor/shared/types/response-query";
import Entity from "@models/entity/entity";
import {
  getCachedBaseIds,
  queryCacheKey,
  setCachedBaseIds,
} from "./query-base-cache";

export default class QuerySearch {
  static MAX_LIMIT = 100;
  static DEFAULT_LIMIT = 10;

  root: SearchNode;
  explore: Explore.IExplore;
  results: Results<IEntity> | null;
  private readonly queryForCache: Query.INode;

  constructor(query: Query.INode, explore: Explore.IExplore) {
    this.queryForCache = query;
    this.root = new SearchNode(query);
    this.explore = explore;

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

    const cacheKey = queryCacheKey(this.queryForCache);
    const cachedIds = getCachedBaseIds(cacheKey);
    if (cachedIds) {
      this.results = new Results<IEntity>();
      this.results.items = [...cachedIds];
      return this.results.items;
    }

    this.results = await this.root.run(db);
    const ids = this.results.items || [];
    setCachedBaseIds(cacheKey, ids);
    return ids;
  }

  async getResults(
    db: Connection,
    indices: number[] | false = false
  ): Promise<IResponseQueryEntity[]> {
    if (!this.results) {
      return [];
    }

    await this.results.applyExploreFilters(db, this.explore);

    // sort
    this.results.sort(this.explore.sort);

    const filteredIds = this.results.filter(this.explore);
    const filtered = await Entity.findEntitiesByIds(db, filteredIds);

    const out: IResponseQueryEntity[] = [];

    for (const entity of filtered) {
      const rowI = filteredIds.indexOf(entity.id);

      if (!indices || indices.includes(rowI)) {
        out.push({
          rowI,
          entity,
          columnData: await this.results!.columns(
            db,
            entity,
            this.explore.columns
          ),
        });
      }
    }

    return out;
  }

  /**
   * Shorthand for addEdge of root node
   * @param edgeData
   */
  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
