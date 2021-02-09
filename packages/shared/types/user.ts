import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
  class: "T";
  data: {
    label: string;
    parent: string | false;
  };
  meta: {};
}

export interface UserOptions {
  defaultTerritory: string;
  defaultLanguage: string;
  searchLanguages: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  options: UserOptions;
  bookmarks: ActantI[];
}
