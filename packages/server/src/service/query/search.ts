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
import {
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";
import { aggregateAuditStats } from "@models/stats/aggregate";
import { EXPLORE_STATS_ENTITY_LIMIT } from "@inkvisitor/shared/types/stats";

export default class QuerySearch {
  static MAX_LIMIT = 100;
  static DEFAULT_LIMIT = 10;

  root: SearchNode;
  explore: Explore.IExplore;
  results: Results<IEntity> | null;
  private readonly queryForCache: Query.INode;
  private resultsExpanded = false;
  // ids APPENDED by expandFilteredResults (#2969), by provenance - used to
  // stamp isEquivalent/isSubordinate on the response entities. Direct matches
  // are never in either set; an id appended by both expansions counts as
  // equivalent only (mirrors response-search).
  private equivalentIds = new Set<string>();
  private subordinateIds = new Set<string>();

  /**
   * Sizes of the provenance sets above - the counts are only final once
   * expandFilteredResults has run, i.e. after getResults()/getStats().
   */
  get expansionCounts(): { equivalents: number; subordinates: number } {
    return {
      equivalents: this.equivalentIds.size,
      subordinates: this.subordinateIds.size,
    };
  }

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

    // The cache holds the RAW unexpanded query matches: the explore filters
    // vary per request and the root-level expansion (#2969) depends on the
    // filtered set, so both are applied per request in
    // expandFilteredResults() - the cache-hit path above goes through the
    // exact same step via getResults()/getStats().
    setCachedBaseIds(cacheKey, ids);
    return ids;
  }

  /**
   * Root-level result expansion (#2969): when the root node carries the
   * include toggles, the FINAL id list is widened with the
   * equivalents/subordinates of the direct matches. Runs on the FILTERED
   * result set (after applyExploreFilters and after the sort in getResults) -
   * the expansion ids are additions, so they are NOT subject to the explore
   * label/ids filters and must be appended after filtering. Invariants:
   * direct matches come first with their (sorted) relative order untouched,
   * expansion ids are appended without duplicating ids already present, and
   * the expansion runs exactly once per request (never on itself, and not
   * twice when both getResults and getStats execute - guarded by
   * resultsExpanded). With both toggles off this is a no-op and no extra
   * queries run.
   */
  private async expandFilteredResults(db: Connection): Promise<void> {
    if (this.resultsExpanded) {
      return;
    }
    this.resultsExpanded = true;

    if (
      !this.results ||
      (!this.root.params.includeEquivalents &&
        !this.root.params.includeSubordinates)
    ) {
      return;
    }

    const ids = this.results.items || [];
    const seen = new Set<string>(ids);
    const expanded = [...ids];
    // equivalents first: when an id would be appended by both expansions, the
    // equivalent provenance wins (mirrors response-search)
    const expansions: Array<[string[], Set<string>]> = [];
    if (this.root.params.includeEquivalents) {
      expansions.push([await getEquivalentEntityIds(db, ids), this.equivalentIds]);
    }
    if (this.root.params.includeSubordinates) {
      expansions.push([await getSubordinateEntityIds(db, ids), this.subordinateIds]);
    }
    for (const [expansionIds, provenance] of expansions) {
      for (const id of expansionIds) {
        if (!seen.has(id)) {
          seen.add(id);
          expanded.push(id);
          provenance.add(id);
        }
      }
    }
    this.results.items = expanded;
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

    // expansion runs after the sort so the direct matches keep their sorted
    // order and the expansion ids stay appended at the end
    await this.expandFilteredResults(db);

    const filteredIds = this.results.filter(this.explore);

    // rowI must stay the index within the WHOLE filtered list, so index all of
    // them - first index wins, same as the former filteredIds.indexOf lookup
    const rowIndexes = new Map<string, number>();
    filteredIds.forEach((id, i) => {
      if (!rowIndexes.has(id)) {
        rowIndexes.set(id, i);
      }
    });
    const wantedIndices = indices ? new Set(indices) : false;

    // ...and load only the rows being returned. Export runs unpaged (limit 0)
    // and picks a handful of rows out of the full result set via rowIndices.
    const idsToLoad = wantedIndices
      ? filteredIds.filter((_, i) => wantedIndices.has(i))
      : filteredIds;

    const filtered = await Entity.findEntitiesByIds(db, idsToLoad);

    // stamp document anchor spans onto statement rows so tags can show them
    // as labels (response-only field, see IEntity.anchorTexts); page-limited
    // input, single batched read
    await Entity.applyAnchorTexts(db, filtered);

    const columns =
      this.explore.view.mode === Explore.EViewMode.Table
        ? this.explore.view.columns
        : [];

    const out: IResponseQueryEntity[] = [];

    for (const entity of filtered) {
      const rowI = rowIndexes.get(entity.id) ?? -1;

      if (!wantedIndices || wantedIndices.has(rowI)) {
        const row: IResponseQueryEntity = {
          rowI,
          entity,
          columnData: await this.results!.columns(db, entity, columns),
        };
        // flags only on rows APPENDED by the expansion - direct matches carry
        // neither field (#2969)
        if (this.equivalentIds.has(entity.id)) {
          row.isEquivalent = true;
        } else if (this.subordinateIds.has(entity.id)) {
          row.isSubordinate = true;
        }
        out.push(row);
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
    await this.expandFilteredResults(db);
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
