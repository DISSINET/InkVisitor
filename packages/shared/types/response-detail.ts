/**
 * Very extensive object showing all the details about one actant
 */

import { IResponseActant, IResponseStatement } from ".";

export interface IResponseDetail extends IResponseActant {
    usedCount: number;
    metaProps: IResponseStatement[] // statements with territory T0
}
