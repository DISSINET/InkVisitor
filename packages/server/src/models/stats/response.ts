import { IAudit, IResponseStats } from "@shared/types";
import { Aggregation, TimeUnit } from "@shared/types/stats";
import { IRequest } from "src/custom_typings/request";
import { IRequestStats } from "@shared/types/request-stats";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import Audit from "@models/audit/audit";

export class ResponseStats implements IResponseStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  aggregateBy: Aggregation;
  values: Record<string, Record<string, number>>;

  constructor(request: IRequestStats) {
    this.fromDate = request.fromDate || this.getStartOfCurrentMonth().getTime();
    this.toDate = request.toDate || new Date().getTime();
    this.timeUnit = request.timeUnit || TimeUnit.DAY;
    this.aggregateBy = request.aggregateBy || Aggregation.ACTIVITY_TYPE;

    this.values = {};
  }

  private getStartOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getTimeKey(date: Date, timeUnit: TimeUnit): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 0-based month
    const day = date.getDate().toString().padStart(2, "0");

    switch (timeUnit) {
      case TimeUnit.DAY:
        return `${year}-${month}-${day}`;
      case TimeUnit.WEEK:
        const startOfWeek = new Date(date);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const weekMonth = (startOfWeek.getMonth() + 1).toString().padStart(2, "0");
        const weekDay = startOfWeek.getDate().toString().padStart(2, "0");
        return `${startOfWeek.getFullYear()}-${weekMonth}-${weekDay}`;
      case TimeUnit.MONTH:
        return `${year}-${month}`;
      case TimeUnit.YEAR:
        return `${year}`;
      default:
        throw new Error("Invalid time unit");
    }
  }

  private aggregateByTimeUnit(data: IAudit[]): Record<string, number> {
    const aggregation: Record<string, number> = {};

    data.forEach(item => {
      const dateKey = this.getTimeKey(item.date, this.timeUnit);

      if (dateKey in aggregation) {
        aggregation[dateKey]++;
      } else {
        aggregation[dateKey] = 1;
      }
    });

    return aggregation;
  }

  async prepare(req: IRequest) {
    const result = await rethink
      .table(Audit.table)
      .between(new Date(this.fromDate), new Date(this.toDate), { index: 'date' })
      .run(req.db.connection);

    this.values[Aggregation.ACTIVITY_TYPE] = this.aggregateByTimeUnit(result as IAudit[])
  }
}
