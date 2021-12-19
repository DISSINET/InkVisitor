/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseStatement extends IStatement {
  entities: object; // all entities (IActant) used in actions/actants, actions/actants.props.type/value, territory, references and tags
  // usedIn?: IStatement[];
  right?: UserRoleMode;
}
