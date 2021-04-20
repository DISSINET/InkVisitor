/**
 * type of the /user endpoint response
 */

import { IActant } from ".";

// TODO
export interface IResponseActant extends IActant {
  usedCount: number;
}
