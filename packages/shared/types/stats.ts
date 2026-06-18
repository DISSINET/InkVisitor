export enum TimeUnit {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export enum EventType {
  EDIT = "edit",
  DELETE = "delete",
  CREATE = "create",
  TEXT_EDIT = "text_edit",
  ANCHOR_ADD = "anchor_add",
  ANCHOR_DELETE = "anchor_delete",
  ANCHOR_EDIT = "anchor_edit",
}

export enum Aggregation {
  USER = "user",
  // ENTITY_TYPE = "entityType",
  ACTIVITY_TYPE = "activityType", // in case of edit activity type
}

/**
 * Upper bound on the number of entities whose audits are aggregated for the
 * Explorer stats view. The filtered result can be huge; passing the whole id
 * list into the audit query floods the db connection pool, so the explorer caps
 * it and tells the user when the cap was hit.
 */
export const EXPLORE_STATS_ENTITY_LIMIT = 100;

/**
 * Core temporal-aggregation params shared by the global stats request
 * (IRequestStats) and the Explorer stats view (Explore.IExploreStatsParams), so
 * both stay in sync and feed the same `aggregateAuditStats` server logic.
 */
export interface IStatsAggregationParams {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  eventType: EventType[];
  aggregateBy: Aggregation;
}
