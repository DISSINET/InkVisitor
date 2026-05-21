export const OTHERS_KEY = "others";
export const TABLE_PADDING = 30;
export const USER_THRESHOLD_MAX = 20;
export const STATS_FILTER_DEBOUNCE_MS = 1200;

export type TimeKey = string;
export type UserId = string;
export type ValuesMap = Record<TimeKey, Record<UserId, number>>;
