import { Connection } from "rethinkdb-ts";

export enum EventTypes {
  BEFORE_ACTANT_DELETE = "BEFORE_ACTANT_DELETE",
  AFTER_ACTANT_DELETE = "AFTER_ACTANT_DELETE",
  AFTER_STATEMENT_UPDATE = "AFTER_STATEMENT_UPDATE",
  AFTER_TERRITORY_UPDATE = "AFTER_TERRITORY_UPDATE",
}

export type EmitterCb = (db: Connection, actantId: string) => Promise<void>;

export type EventMapSingle = { [key in EventTypes]?: EmitterCb };

export type EventMap = { [key in EventTypes]?: EmitterCb[] };
