/**
 *
 */

import { IEntity } from ".";

export interface IResponseBookmarkFolder {
  id: string;
  name: string;
  entities: IEntity[];
}
