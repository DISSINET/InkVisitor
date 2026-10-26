import { Conn } from "@service/storage";

export enum EventTypes {
  BEFORE_ENTITY_DELETE = "BEFORE_ENTITY_DELETE",
  AFTER_ENTITY_DELETE = "AFTER_ENTITY_DELETE",
  AFTER_STATEMENT_UPDATE = "AFTER_STATEMENT_UPDATE",
  AFTER_TERRITORY_UPDATE = "AFTER_TERRITORY_UPDATE",
}

export type EmitterCb = (db: Conn, entityId: string) => Promise<void>;

export type EventMapSingle = { [key in EventTypes]?: EmitterCb };

export type EventMap = { [key in EventTypes]?: EmitterCb[] };
