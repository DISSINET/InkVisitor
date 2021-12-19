/**
 * Very extensive object showing all the details about one actant
 */

import { IResponseActant } from ".";

export interface IResponseDetail extends IResponseActant {
  // usedCount: number;
  entities: object; // all entities (IActant) from props.type/value
}
