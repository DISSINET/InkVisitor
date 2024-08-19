import { IResponseStats } from "@shared/types";
import { Aggregation, TimeUnit } from "@shared/types/stats";
import { IRequest } from "src/custom_typings/request";
import { IRequestStats } from "@shared/types/request-stats";

export class ResponseStats implements IResponseStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  aggregateBy: Aggregation;
  values: Record<string, Record<string, number>>;

  constructor(request: IRequestStats) {
    this.fromDate = request.fromDate;
    this.toDate = request.toDate;
    this.timeUnit = request.timeUnit;
    this.aggregateBy = request.aggregateBy;

    this.values = {};
  }

  async prepare(req: IRequest) { }
}
