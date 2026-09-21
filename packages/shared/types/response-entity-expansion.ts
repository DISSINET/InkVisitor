import { IEntity } from "./entity";

/**
 * Maximum number of entity rows a single expansion response carries, counted
 * across both groups. A Territory's subordinate closure is a walk of the whole
 * child-territory subtree with no upper bound, so the row list is capped while
 * `totals` stays exact - the node badge must never show a capped number.
 */
export const EXPANSION_RESPONSE_MAX = 300;

/**
 * The entities a query node's "include equivalents" / "include subordinates"
 * toggles add to its pinned entity, grouped by which toggle produced them.
 * An id reachable both ways is reported as an equivalent only.
 */
export interface IResponseEntityExpansion {
  equivalents: IEntity[];
  subordinates: IEntity[];
  /** true counts, computed before the row cap is applied */
  totals: { equivalents: number; subordinates: number };
  /**
   * Per group: true when EXPANSION_RESPONSE_MAX cut that group's id list
   * short. Compared against the id list, not the resolved row count - a
   * dangling relation id that no longer resolves to a live entity shrinks the
   * row count without the cap ever applying, and must not read as truncation.
   */
  truncated: { equivalents: boolean; subordinates: boolean };
}
