/**
 *
 */

import { IActant } from ".";

export interface IResponseBookmarkFolder {
  id: string;
  name: string;
  actants: IActant[];
}
