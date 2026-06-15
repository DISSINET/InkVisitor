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
