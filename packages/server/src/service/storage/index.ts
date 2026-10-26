/**
 * Storage adapter boundary (#3258). Everything the server needs from its
 * database comes through `storage`; the driver stays inside ./rethink.
 */
export { storage } from "./instance";
export { Db } from "./db";
export { default as DbPool, poolOptions } from "./pool";
export * from "./types";
