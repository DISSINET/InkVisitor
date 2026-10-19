import { v4 as uuidv4 } from "uuid";

/** RethinkDB's JSON wire form of a TIME value, as `rethinkdb export` writes it */
interface ReqlTime {
  $reql_type$: "TIME";
  epoch_time: number;
  timezone: string;
}

const isReqlTime = (value: unknown): value is ReqlTime =>
  typeof value === "object" && value !== null && (value as ReqlTime).$reql_type$ === "TIME";

/**
 * Replaces every TIME wire object with a Date, in place. Same arithmetic as
 * the rethinkdb-ts response parser, so a value inserted through this path
 * reads back from RethinkDB exactly like one inserted as the wire object.
 */
export function reviveTimes(value: unknown): unknown {
  if (Array.isArray(value)) {
    value.forEach((item, i) => (value[i] = reviveTimes(item)));
    return value;
  }
  if (isReqlTime(value)) {
    return new Date(value.epoch_time * 1000);
  }
  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = reviveTimes(record[key]);
    }
  }
  return value;
}

/**
 * Rows as a target stores them. Ids are assigned before any write so a row
 * keeps one id wherever it is written; TIME wire objects become Dates so the
 * stored instant does not depend on the target.
 */
export function prepareRows<T extends Record<string, any>>(rows: T[]): T[] {
  for (const row of rows) {
    if (row.id === undefined || row.id === null || row.id === "") {
      (row as Record<string, unknown>).id = uuidv4();
    }
    reviveTimes(row);
  }
  return rows;
}
