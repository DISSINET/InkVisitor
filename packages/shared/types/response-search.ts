/**
 * type of the /user endpoint response
 */

import { ActantType } from "../enums";

export interface IResponseSearch {
  class: ActantType;
  actantId: string;
  actantLabel: string;
}
