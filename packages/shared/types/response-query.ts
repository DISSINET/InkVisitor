import { Query, Explore } from "./query";
import { IEntity } from "./entity";
import { IUser } from "./user";

export interface IResponseQueryEntity {
  rowI?: number;
  entity: IEntity; // the actual passing entity model
  /** Surfaced via "include equivalents" result expansion rather than a direct match (#2969). */
  isEquivalent?: boolean;
  /** Surfaced via "include subordinates" result expansion rather than a direct match (#2969). */
  isSubordinate?: boolean;
  columnData: Record<
    string,
    IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[]
  >;
}

export interface IResponseQuery {
  query: Query.INode;
  explore: Explore.IExplore;
  /** Full ordered entity ids for the whole result (ignores explore offset/limit). */
  entityIds: string[];
  entities: IResponseQueryEntity[];
  total: number;
  /**
   * Audit stats aggregated over the whole filtered result set, present only when
   * the explore view mode is Stats. Shape mirrors IResponseStats.values:
   * dateBucket -> aggregationKey -> count.
   */
  stats?: Record<string, Record<string, number>>;
  /**
   * Cap on the number of entities the Stats view aggregates audits over, present
   * only in the Stats view. When `total` exceeds it, the stats cover just the
   * first `statsEntityLimit` entities and the client surfaces a warning.
   */
  statsEntityLimit?: number;
}
