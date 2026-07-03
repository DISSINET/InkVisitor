import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { VISIBLE_EVENT_TYPES } from "./constants";

export interface StatsStore {
  dateFrom: string;
  dateTo: string;

  timeUnit: TimeUnit;
  aggregate: Aggregation;
  eventType: EventType[];
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
  | { type: "showAggregateOptionsUpdate"; payload: boolean }
  | { type: "showDateFromRangePickerUpdate"; payload: boolean }
  | { type: "showDateToRangePickerUpdate"; payload: boolean };

export const initialState: StatsStore = {
  dateFrom: new Date("2000-01-01").toISOString(),
  dateTo: new Date().toISOString(),
  timeUnit: TimeUnit.YEAR,
  aggregate: Aggregation.USER,
  eventType: [...VISIBLE_EVENT_TYPES],
  showAggregateOptions: false, // Hidden by default
  showDateFromRangePicker: false, // Hidden by default, show "Since Forever"
  showDateToRangePicker: false, // Hidden by default, show "Until Now"
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
