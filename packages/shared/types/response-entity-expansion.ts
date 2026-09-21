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
  /** set when the row lists were cut short by EXPANSION_RESPONSE_MAX */
  truncated: boolean;
}
