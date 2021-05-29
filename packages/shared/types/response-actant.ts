/**
 * type of the /user endpoint response
 */

import { IActant, IStatement } from ".";

export interface IResponseActant extends IActant {
  usedCount?: number;
  usedIn?: IStatement[];
}
