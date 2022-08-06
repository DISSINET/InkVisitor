/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IEntity, IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseStatement extends IStatement {
  entities: { [key: string]: IEntity }; // all entities (IEntity) used in actions/actants, actions/actants.props.type/value, territory, references, tags, actant identifications and classifications
  // usedIn?: IStatement[];
  right?: UserRoleMode;
}
