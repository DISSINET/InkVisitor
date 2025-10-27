import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";

export interface StatsStore {
  timeFrom: string;
  timeTo: string;

  timeUnit: TimeUnit;
  aggregate: Aggregation;
  eventType: EventType[];
  useMaterialized: boolean;
  showAggregateOptions: boolean;
}

export type StatsStoreAction =
  | { type: "timeFromUpdate"; payload: string }
  | { type: "timeToUpdate"; payload: string }
  | { type: "timeUnitUpdate"; payload: TimeUnit }
  | { type: "aggregateUpdate"; payload: Aggregation }
  | { type: "eventTypeUpdate"; payload: EventType }
  | { type: "useMaterializedUpdate"; payload: boolean }
  | { type: "showAggregateOptionsUpdate"; payload: boolean };

export const initialState: StatsStore = {
  timeFrom: new Date(
    new Date().setFullYear(new Date().getFullYear() - 3)
  ).toISOString(),
  timeTo: new Date().toISOString(),
  timeUnit: TimeUnit.YEAR,
  aggregate: Aggregation.USER,
  eventType: [EventType.EDIT, EventType.DELETE, EventType.CREATE],
  useMaterialized: false, // Default to materialized for better performance
  showAggregateOptions: false, // Hidden by default
};

export const statsReducer = (
  state: StatsStore,
  action: StatsStoreAction
): StatsStore => {
  switch (action.type) {
    case "timeFromUpdate":
      return { ...state, timeFrom: action.payload };
    case "timeToUpdate":
      return { ...state, timeTo: action.payload };
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
    case "useMaterializedUpdate":
      return { ...state, useMaterialized: action.payload };
    case "showAggregateOptionsUpdate":
      return { ...state, showAggregateOptions: action.payload };
    default:
      return state;
  }
};
