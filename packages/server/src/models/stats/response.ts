import Audit from "@models/audit/audit";
import { IResponseStats } from "@inkvisitor/shared/types";
import { IRequestStats } from "@inkvisitor/shared/types/request-stats";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { RDatum, r as rethink } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";

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
    const { fromDate, toDate, timeUnit, aggregateBy } = this;

    let timeBucket;
    switch (timeUnit) {
      case TimeUnit.DAY:
        timeBucket = (doc: RDatum) => doc("date").toISO8601().slice(0, 10);
        break;
      case TimeUnit.WEEK:
        timeBucket = (doc: RDatum) => {
          const date = doc("date");
          return date
            .sub(date.dayOfWeek().sub(1).mul(86400))
            .toISO8601()
            .slice(0, 10);
        };
        break;
      case TimeUnit.MONTH:
        timeBucket = (doc: RDatum) => doc("date").toISO8601().slice(0, 7);
        break;
      case TimeUnit.YEAR:
        timeBucket = (doc: RDatum) => doc("date").toISO8601().slice(0, 4);
        break;
      default:
        throw new Error("Invalid time unit");
    }

    const aggregatedData = (await rethink
      .table(Audit.table)
      .between(new Date(fromDate), new Date(toDate), {
        index: "date",
      })
      .filter((doc: RDatum) =>
        rethink.expr(this.eventType).contains(doc("type"))
      )
      .group(timeBucket, (doc: RDatum) =>
        aggregateBy === Aggregation.ACTIVITY_TYPE
          ? doc("type")
          : doc(aggregateBy)
      )
      .count()
      .run(req.db.connection)) as unknown as {
      group: [string, string];
      reduction: number;
    }[];

    const newValues: Record<string, Record<string, number>> = {};
    for (const item of aggregatedData) {
      const [dateKey, aggregationGroup] = item.group;
      if (!newValues[dateKey]) {
        newValues[dateKey] = {};
      }
      newValues[dateKey][aggregationGroup] = item.reduction;
    }

    this.values = newValues;
  }
}
