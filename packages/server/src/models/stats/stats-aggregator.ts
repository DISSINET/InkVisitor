import { r as rethink, Connection, RDatum } from "rethinkdb-ts";
import { EventType, Aggregation, TimeUnit } from "@shared/types/stats";
import Audit from "@models/audit/audit";
import { MaterializedStats, IMaterializedStats } from "./materialized-stats";

export class StatsAggregator {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  /**
   * Aggregates audit data for a specific date range and time unit
   */
  async aggregateForDateRange(
    fromDate: Date,
    toDate: Date,
    timeUnit: TimeUnit,
    eventTypes: EventType[],
    aggregateBy: Aggregation
  ): Promise<IMaterializedStats[]> {
    const timeBucket = this.getTimeBucketFunction(timeUnit);
    const fromDateTruncated = this.truncateToMidnight(fromDate);
    const toDateTruncated = this.truncateToMidnight(toDate);

    // Query audits table with the same logic as the original ResponseStats
    const aggregatedData = (await rethink
      .table(Audit.table)
      .between(fromDateTruncated, toDateTruncated, {
        index: "date",
      })
      .filter((doc: RDatum) =>
        rethink.expr(eventTypes).contains(doc("type"))
      )
      .group(timeBucket, (doc: RDatum) =>
        aggregateBy === Aggregation.ACTIVITY_TYPE
          ? doc("type")
          : doc(aggregateBy)
      )
      .count()
      .run(this.db)) as unknown as {
      group: [string, string];
      reduction: number;
    }[];

    // Transform aggregated data into MaterializedStats format
    const materializedStats: IMaterializedStats[] = [];
    
    for (const item of aggregatedData) {
      const [dateKey, aggregationGroup] = item.group;
      
      // Create separate entries for each event type
      for (const eventType of eventTypes) {
        const stats: IMaterializedStats = {
          id: MaterializedStats.generateId(dateKey, eventType, aggregateBy, aggregationGroup),
          date: dateKey,
          eventType: eventType,
          aggregateBy: aggregateBy,
          aggregationKey: aggregationGroup,
          count: item.reduction,
          lastUpdated: new Date()
        };
        materializedStats.push(stats);
      }
    }

    return materializedStats;
  }

  /**
   * Aggregates data for all time units and saves to materialized tables
   */
  async aggregateAllTimeUnits(
    fromDate: Date,
    toDate: Date,
    eventTypes: EventType[],
    aggregateBy: Aggregation
  ): Promise<void> {
    const timeUnits = [TimeUnit.DAY, TimeUnit.WEEK, TimeUnit.MONTH, TimeUnit.YEAR];
    
    for (const timeUnit of timeUnits) {
      try {
        console.log(`Aggregating ${timeUnit} data from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
        
        const stats = await this.aggregateForDateRange(
          fromDate,
          toDate,
          timeUnit,
          eventTypes,
          aggregateBy
        );

        if (stats.length > 0) {
          await MaterializedStats.bulkInsert(this.db, timeUnit, stats);
          console.log(`Inserted ${stats.length} ${timeUnit} stats records`);
        }
      } catch (error) {
        console.error(`Error aggregating ${timeUnit} data:`, error);
      }
    }
  }

  /**
   * Gets the time bucket function for a specific time unit
   */
  private getTimeBucketFunction(timeUnit: TimeUnit) {
    switch (timeUnit) {
      case TimeUnit.DAY:
        return (doc: RDatum) => doc("date").toISO8601().slice(0, 10);
      case TimeUnit.WEEK:
        return (doc: RDatum) => {
          const date = doc("date");
          return date
            .sub(date.dayOfWeek().sub(1).mul(86400))
            .toISO8601()
            .slice(0, 10);
        };
      case TimeUnit.MONTH:
        return (doc: RDatum) => doc("date").toISO8601().slice(0, 7);
      case TimeUnit.YEAR:
        return (doc: RDatum) => doc("date").toISO8601().slice(0, 4);
      default:
        throw new Error("Invalid time unit");
    }
  }

  /**
   * Truncates a date to midnight (start of day)
   */
  private truncateToMidnight(date: Date): Date {
    const truncated = new Date(date);
    truncated.setHours(0, 0, 0, 0);
    return truncated;
  }

  /**
   * Aggregates missing data for all time units from the last update date
   */
  async aggregateMissingData(): Promise<void> {
    const timeUnits = [TimeUnit.DAY, TimeUnit.WEEK, TimeUnit.MONTH, TimeUnit.YEAR];
    const eventTypes = [EventType.EDIT, EventType.DELETE, EventType.CREATE];
    const aggregateByOptions = [Aggregation.USER, Aggregation.ACTIVITY_TYPE];
    
    for (const timeUnit of timeUnits) {
      try {
        const latestUpdate = await MaterializedStats.getLatestUpdateDate(this.db, timeUnit);
        const fromDate = latestUpdate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago if no data
        const toDate = new Date();
        
        console.log(`Aggregating missing ${timeUnit} data from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
        
        for (const aggregateBy of aggregateByOptions) {
          await this.aggregateForDateRange(
            fromDate,
            toDate,
            timeUnit,
            eventTypes,
            aggregateBy
          );
        }
      } catch (error) {
        console.error(`Error aggregating missing ${timeUnit} data:`, error);
      }
    }
  }
}
