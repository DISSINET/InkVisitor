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
}

export enum Aggregation {
  USER = "user",
  ENTITY_TYPE = "entityType",
  ACTIVITY_TYPE = "activityType", // in case of edit activity type
}
