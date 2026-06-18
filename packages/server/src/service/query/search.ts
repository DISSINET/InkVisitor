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
import { getRowIdsFilter } from "./explore-ids-filter";
import { aggregateAuditStats } from "@models/stats/aggregate";
import { EXPLORE_STATS_ENTITY_LIMIT } from "@inkvisitor/shared/types/stats";

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

    if (
      this.explore.view.mode === Explore.EViewMode.Table &&
      !this.explore.view.columns
    ) {
      this.explore.view.columns = [];
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

    // When the UUIDs filter is active, order rows by the order the ids were typed
    // into the filter (column sort is ignored while ids are present); otherwise use
    // the regular sort.
    const rowIdsFilter = getRowIdsFilter(this.explore.filters);
    if (rowIdsFilter?.ids.length) {
      this.results.orderByIds(rowIdsFilter.ids);
    } else {
      this.results.sort(this.explore.sort);
    }

    const filteredIds = this.results.filter(this.explore);
    const filtered = await Entity.findEntitiesByIds(db, filteredIds);

    const columns =
      this.explore.view.mode === Explore.EViewMode.Table
        ? this.explore.view.columns
        : [];

    const out: IResponseQueryEntity[] = [];

    for (const entity of filtered) {
      const rowI = filteredIds.indexOf(entity.id);

      if (!indices || indices.includes(rowI)) {
        out.push({
          rowI,
          entity,
          columnData: await this.results!.columns(db, entity, columns),
        });
      }
    }

    return out;
  }

  /**
   * Aggregates audit stats over the filtered result set (the explore
   * offset/limit pagination is intentionally ignored - stats cover the whole
   * result, not a single page). Only meaningful when the view mode is Stats;
   * returns {} otherwise. Must be called after run().
   *
   * The entity list is capped at EXPLORE_STATS_ENTITY_LIMIT before it reaches
   * the audit query: an unbounded id list flooded the db connection pool. The
   * caller compares the full result `total` against the limit to warn the user.
   */
  async getStats(
    db: Connection
  ): Promise<Record<string, Record<string, number>>> {
    if (!this.results) {
      return {};
    }
    if (this.explore.view.mode !== Explore.EViewMode.Stats) {
      return {};
    }

    await this.results.applyExploreFilters(db, this.explore);
    const entityIds = (this.results.items ?? []).slice(
      0,
      EXPLORE_STATS_ENTITY_LIMIT
    );

    return aggregateAuditStats(db, this.explore.view.stats, { entityIds });
  }

  /**
   * Shorthand for addEdge of root node
   * @param edgeData
   */
  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    return this.root.addEdge(edgeData);
  }
}
