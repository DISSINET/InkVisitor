import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";

export interface StatsStore {
  dateFrom: string;
  dateTo: string;

  timeUnit: TimeUnit;
  aggregate: Aggregation;
  eventType: EventType[];
  useMaterialized: boolean;
  showAggregateOptions: boolean;
  showDateFromRangePicker: boolean;
  showDateToRangePicker: boolean;
}

export type StatsStoreAction =
  | { type: "dateFromUpdate"; payload: string }
  | { type: "dateToUpdate"; payload: string }
  | { type: "timeUnitUpdate"; payload: TimeUnit }
  | { type: "aggregateUpdate"; payload: Aggregation }
  | { type: "eventTypeUpdate"; payload: EventType }
  | { type: "useMaterializedUpdate"; payload: boolean }
  | { type: "showAggregateOptionsUpdate"; payload: boolean }
  | { type: "showDateFromRangePickerUpdate"; payload: boolean }
  | { type: "showDateToRangePickerUpdate"; payload: boolean };

export const initialState: StatsStore = {
  dateFrom: new Date("2000-01-01").toISOString(),
  dateTo: new Date().toISOString(),
  timeUnit: TimeUnit.YEAR,
  aggregate: Aggregation.USER,
  eventType: [EventType.TEXT_EDIT, EventType.ANCHOR_ADD],
  useMaterialized: false, // Default to materialized for better performance
  showAggregateOptions: false, // Hidden by default
  showDateFromRangePicker: false, // Hidden by default, show "Since Forever"
  showDateToRangePicker: false, // Hidden by default, show "Until Now"
};

/** Fresh state on each mount so dateTo is current without a post-mount dispatch. */
export const createEntitiesTabState = (): StatsStore => ({
  ...initialState,
  dateTo: new Date().toISOString(),
});

export const statsReducer = (state: StatsStore, action: StatsStoreAction): StatsStore => {
  switch (action.type) {
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
    case "useMaterializedUpdate":
      return { ...state, useMaterialized: action.payload };
    case "showAggregateOptionsUpdate":
      return { ...state, showAggregateOptions: action.payload };
    case "showDateFromRangePickerUpdate":
      return { ...state, showDateFromRangePicker: action.payload };
    case "showDateToRangePickerUpdate":
      return { ...state, showDateToRangePicker: action.payload };
    default:
      return state;
  }
};
