/**
 * type of the /user endpoint response
 */

import { IActant, IStatement } from ".";

// TODO
export interface IResponseActant extends IActant {
  usedCount: number;
  usedIn: IStatement[] // all statement where the actant is used
}
