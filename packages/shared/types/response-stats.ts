import { TimeUnit, Aggregation } from "./stats";

export interface IResponseStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;

  aggregateBy: Aggregation;
  // the first key is the date (yyyy-dd-mm format), the second is the aggregation group
  values: Record<string, Record<string, number>>;
}
