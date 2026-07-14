import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { StatsPeriod, VISIBLE_EVENT_TYPES } from "./constants";

export interface StatsStore {
  period: StatsPeriod;
  dateFrom: string;
  dateTo: string;

  timeUnit: TimeUnit;
  aggregate: Aggregation;
  eventType: EventType[];
  showAggregateOptions: boolean;
}

export type StatsStoreAction =
  | { type: "periodUpdate"; payload: StatsPeriod }
  | { type: "dateFromUpdate"; payload: string }
  | { type: "dateToUpdate"; payload: string }
  | { type: "timeUnitUpdate"; payload: TimeUnit }
  | { type: "aggregateUpdate"; payload: Aggregation }
  | { type: "eventTypeUpdate"; payload: EventType }
  | { type: "eventTypeGroupUpdate"; payload: { types: EventType[]; active: boolean } }
  | { type: "showAggregateOptionsUpdate"; payload: boolean };

export const initialState: StatsStore = {
  period: "all",
  dateFrom: new Date("2000-01-01").toISOString(),
  dateTo: new Date().toISOString(),
  timeUnit: TimeUnit.YEAR,
  aggregate: Aggregation.USER,
  eventType: [...VISIBLE_EVENT_TYPES],
  showAggregateOptions: false, // Hidden by default
};

/** dateFrom/dateTo for a non-custom period preset, relative to now. */
export const periodToDateRange = (
  period: Exclude<StatsPeriod, "custom">,
): { dateFrom: string; dateTo: string } => {
  const now = new Date();
  const from = new Date(now);
  switch (period) {
    case "all":
      return {
        dateFrom: new Date("2000-01-01").toISOString(),
        dateTo: now.toISOString(),
      };
    case "year":
      from.setFullYear(now.getFullYear() - 1);
      break;
    case "month":
      from.setMonth(now.getMonth() - 1);
      break;
    case "week":
      from.setDate(now.getDate() - 7);
      break;
  }
  return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
};

/**
 * Fresh state on each mount so dateTo is current without a post-mount dispatch.
 * The selectable event types are passed in so the same component can drive the
 * Entities tab and the Relations tab.
 */
export const createEntitiesTabState = (eventType: EventType[]): StatsStore => ({
  ...initialState,
  eventType: [...eventType],
  dateTo: new Date().toISOString(),
});

export const statsReducer = (state: StatsStore, action: StatsStoreAction): StatsStore => {
  switch (action.type) {
    case "periodUpdate": {
      const period = action.payload;
      if (period === "custom") {
        return { ...state, period };
      }
      return { ...state, period, ...periodToDateRange(period) };
    }
    case "dateFromUpdate":
      return { ...state, dateFrom: action.payload };
    case "dateToUpdate":
      return { ...state, dateTo: action.payload };
    case "timeUnitUpdate":
      return { ...state, timeUnit: action.payload };
    case "aggregateUpdate":
      return { ...state, aggregate: action.payload };
    case "eventTypeUpdate":
      const eventTypeToHandle = action.payload;
      const isEventTypeActive = state.eventType.includes(eventTypeToHandle);

      // if active, deactivate, otherwise activate
      const newEventTypes: EventType[] = isEventTypeActive
        ? state.eventType.filter((type) => type !== eventTypeToHandle)
        : [...state.eventType, eventTypeToHandle];
      return { ...state, eventType: newEventTypes };
    case "eventTypeGroupUpdate": {
      const { types, active } = action.payload;
      const withoutGroup = state.eventType.filter((type) => !types.includes(type));
      return {
        ...state,
        eventType: active ? [...withoutGroup, ...types] : withoutGroup,
      };
    }
    case "showAggregateOptionsUpdate":
      return { ...state, showAggregateOptions: action.payload };
    default:
      return state;
  }
};
