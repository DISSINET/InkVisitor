/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant } from ".";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IActant }; // all entities (IActant) from props.type/value
}
