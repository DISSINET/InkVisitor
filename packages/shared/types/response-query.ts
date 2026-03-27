import { Query, Explore } from "./query";
import { IEntity } from "./entity";
import { IUser } from "./user";

export interface IResponseQueryEntity {
  rowI?: number;
  entity: IEntity; // the actual passing entity model
  columnData: Record<
    string,
    | IEntity
    | IEntity[]
    | number
    | number[]
    | string
    | string[]
    | IUser
    | IUser[]
  >;
}

export interface IResponseQuery {
  query: Query.INode;
  explore: Explore.IExplore;
  /** Full ordered entity ids for the whole result (ignores explore offset/limit). */
  entityIds: string[];
  entities: IResponseQueryEntity[];
  total: number;
}
