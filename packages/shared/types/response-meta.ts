/**
 * type of the /territory endpoint response
 */

import { ActionI, DictionaryEntryI } from ".";

export interface ResponseMetaI {
  actions: ActionI[];
  dictionaries: { [key: string]: DictionaryEntryI[] };
}
