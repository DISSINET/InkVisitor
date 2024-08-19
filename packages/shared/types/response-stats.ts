import { TimeUnit, Aggregation } from "./stats";

export interface IResponseStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;

  aggregateBy: Aggregation;
  // aggregated entries for date in yyyy-dd-mm format
  values: Record<string, number>;
}
