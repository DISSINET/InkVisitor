import { IResponseStats } from "@inkvisitor/shared/types";
import { IRequestStats } from "@inkvisitor/shared/types/request-stats";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { IRequest } from "src/custom_typings/request";
import { aggregateAuditStats } from "./aggregate";

export class ResponseStats implements IResponseStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  eventType: EventType[];
  aggregateBy: Aggregation;
  values: Record<string, Record<Aggregation, number>>;

  constructor(request: IRequestStats) {
    this.fromDate = request.fromDate || this.getStartOfCurrentMonth().getTime();
    this.toDate = request.toDate || new Date().getTime();
    this.timeUnit = request.timeUnit || TimeUnit.DAY;
    this.aggregateBy = request.aggregateBy || Aggregation.ACTIVITY_TYPE;
    this.eventType = request.eventType || [
      EventType.EDIT,
      EventType.DELETE,
      EventType.CREATE,
    ];

    this.values = {};
  }

  private getStartOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  async prepare(req: IRequest) {
    // Whole-database stats: no entityIds restriction. `this` already provides the
    // IStatsAggregationParams fields (fromDate/toDate/timeUnit/eventType/aggregateBy).
    this.values = (await aggregateAuditStats(
      req.db.connection,
      this
    )) as Record<string, Record<Aggregation, number>>;
  }
}
