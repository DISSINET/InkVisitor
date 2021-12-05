/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant, IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseDetail extends IResponseActant {
  usedCount: number;
  entities: object; // all entities (IActant) from props.type/value
}
