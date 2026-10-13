import { UserEnums } from "../enums";
import { Query, Explore } from "./query";
import { IEntity } from "./entity";
import { IUser } from "./user";

export interface IResponseQueryEntity {
  rowI?: number;
  entity: IEntity; // the actual passing entity model
  /**
   * The requesting user's mode for this row's entity, derived the same way as
   * IResponseEntity.right. Editable columns act on the row entity, so this is
   * what decides whether its cells render as controls or as plain values.
   */
  right?: UserEnums.RoleMode;
  /** Surfaced via "include equivalents" result expansion rather than a direct match (#2969). */
  isEquivalent?: boolean;
  /** Surfaced via "include subordinates" result expansion rather than a direct match (#2969). */
  isSubordinate?: boolean;
  columnData: Record<
    string,
    IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[]
  >;
  /**
   * Trees for the cells of property columns, by column id and then by the cell
   * entity they sit under. In "Entity Property value" columns the key is a
   * value and the nodes are the first-level props with that value, each with
   * its subproperties. In "Entity Property types" columns the key is a type
   * and the nodes are the subproperty types used under its props, merged so
   * each appears once per level, with only `type` set. Present for a column
   * once one of its shown props has subproperties; then it covers every entity
   * the cell shows. Kept apart from columnData so its cells stay flat entity
   * lists.
   */
  columnSubProps?: Record<string, Record<string, IResponseQuerySubProp[]>>;
}

/**
 * One prop resolved for display: its type and value entities and its nested
 * subproperties. A side whose entity is unset or missing is left out.
 */
export interface IResponseQuerySubProp {
  type?: IEntity;
  value?: IEntity;
  children: IResponseQuerySubProp[];
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
   * How many rows of the result were appended by result expansion (#2969)
   * rather than matched directly, by provenance. Counted over the whole result
   * set, not the returned page. Zeroes when the toggles are off.
   */
  expansion?: {
    equivalents: number;
    subordinates: number;
  };
  /**
   * Cap on the number of entities the Stats view aggregates audits over, present
   * only in the Stats view. When `total` exceeds it, the stats cover just the
   * first `statsEntityLimit` entities and the client surfaces a warning.
   */
  statsEntityLimit?: number;
}
