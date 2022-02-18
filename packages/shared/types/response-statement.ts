/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IEntity, IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseStatement extends IStatement {
  entities: { [key: string]: IEntity }; // all entities used in actions/actants, actions/actants.props.type/value, territory, references and tags
  // usedIn?: IStatement[];
  right?: UserRoleMode;
}
