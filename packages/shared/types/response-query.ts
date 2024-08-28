import { Query } from "./query";
import { IEntity } from "./entity";

export interface IResponseQuery extends Query.INode {
  entities: IEntity[];
}
