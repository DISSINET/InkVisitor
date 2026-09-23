import { Connection } from "rethinkdb-ts";

import {
  ISubordinateExpansionOptions,
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";

/**
 * One direction an entity can stand for more than itself in: sideways to the
 * entities recorded as equivalent, or downward to what lies below it.
 */
export type ExpansionDirection = "equivalents" | "subordinates";

/**
 * The ids one direction adds to one entity - the single place that decides
 * which relation helper answers which direction. A query node takes the whole
 * downward set; a validation rule field narrows it to the path that field
 * stands for, which is what `opts` is for.
 * @param db db connection
 * @param entityId the entity standing for more than itself
 * @param direction sideways or downward
 * @param opts narrows the downward walk; ignored for equivalents
 */
export const resolveExpansionIds = async (
  db: Connection,
  entityId: string,
  direction: ExpansionDirection,
  opts?: ISubordinateExpansionOptions
): Promise<string[]> =>
  direction === "equivalents"
    ? getEquivalentEntityIds(db, [entityId])
    : getSubordinateEntityIds(db, [entityId], opts);

export interface INodeExpansionOptions {
  equivalents: boolean;
  subordinates: boolean;
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
    ? await resolveExpansionIds(db, entityId, "equivalents")
    : [];

  if (!opts.subordinates) {
    return { equivalents, subordinates: [] };
  }

  const claimed = new Set<string>(equivalents);
  const subordinates = (
    await resolveExpansionIds(db, entityId, "subordinates")
  ).filter((id) => !claimed.has(id));

  return { equivalents, subordinates };
};
