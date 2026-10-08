import { Connection } from "rethinkdb-ts";

import {
  ISubordinateExpansionOptions,
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";

export interface INodeExpansionOptions {
  equivalents: boolean;
  subordinates: boolean;
  /**
   * Narrows the downward walk. A query node takes the whole downward set and
   * leaves this out; a validation rule field passes the one path that field
   * stands for (#2527).
   */
  subordinateOptions?: ISubordinateExpansionOptions;
}

export interface INodeExpansionIds {
  equivalents: string[];
  subordinates: string[];
}

/**
 * The ids a query node's "include equivalents" / "include subordinates"
 * toggles add to a pinned entity, kept in separate groups so a caller can show
 * which toggle produced which id.
 *
 * Expansion only: no status or class narrowing happens here. A node with a
 * pinned entity carries neither - the reducer drops `entityStatuses` and
 * `entityClasses` on pin (client `Query/Query/state.ts`) - and `prepare()`
 * applies its own status filter to the flattened set for the unpinned case
 * this function never sees.
 *
 * An id reachable through both expansions is reported as an equivalent only,
 * matching the precedence in `QuerySearch.expandFilteredResults` and
 * `response-search.ts`. The pinned id itself is never returned; both helpers
 * already exclude their inputs.
 *
 * With both options false no query is issued at all.
 */
export const getNodeExpansionIds = async (
  db: Connection,
  entityId: string,
  opts: INodeExpansionOptions
): Promise<INodeExpansionIds> => {
  const equivalents = opts.equivalents
    ? await getEquivalentEntityIds(db, [entityId])
    : [];

  if (!opts.subordinates) {
    return { equivalents, subordinates: [] };
  }

  const claimed = new Set<string>(equivalents);
  const subordinates = (
    await getSubordinateEntityIds(db, [entityId], opts.subordinateOptions)
  ).filter((id) => !claimed.has(id));

  return { equivalents, subordinates };
};
