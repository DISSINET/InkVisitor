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

    // Always group by event type so each materialized row holds the count for a
    // single event type. For USER aggregation we additionally group by the user
    // dimension; for ACTIVITY_TYPE the event type itself is the aggregation key.
    const baseQuery = rethink
      .table(Audit.table)
      .between(fromDateTruncated, toDateTruncated, {
        index: "date",
      })
      .filter((doc: RDatum) => rethink.expr(eventTypes).contains(doc("type")));

    const groupedQuery =
      aggregateBy === Aggregation.ACTIVITY_TYPE
        ? baseQuery.group(timeBucket, (doc: RDatum) => doc("type"))
        : baseQuery.group(
            timeBucket,
            (doc: RDatum) => doc("type"),
            (doc: RDatum) => doc(aggregateBy)
          );

    const aggregatedData = (await groupedQuery.count().run(this.db)) as unknown as {
      group: string[];
      reduction: number;
    }[];

    return StatsAggregator.mapGroupedAuditsToStats(aggregatedData, aggregateBy);
  }

  /**
   * Maps grouped audit counts into materialized stats rows.
   * The grouping always includes the event type as the second key, so each
   * grouped item maps to exactly one row (no fan-out across event types):
   * - ACTIVITY_TYPE: group = [date, type], aggregationKey = type
   * - USER (or other key): group = [date, type, key], aggregationKey = key
   */
  static mapGroupedAuditsToStats(
    aggregatedData: { group: string[]; reduction: number }[],
    aggregateBy: Aggregation
  ): IMaterializedStats[] {
    const lastUpdated = new Date();

    return aggregatedData.map((item) => {
      const dateKey = item.group[0];
      const eventType = item.group[1] as EventType;
      const aggregationKey =
        aggregateBy === Aggregation.ACTIVITY_TYPE ? eventType : item.group[2];

      return {
        id: MaterializedStats.generateId(
          dateKey,
          eventType,
          aggregateBy,
          aggregationKey
        ),
        date: dateKey,
        eventType,
        aggregateBy,
        aggregationKey,
        count: item.reduction,
        lastUpdated,
      };
    });
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
    const eventTypes = Object.values(EventType);
    const aggregateByOptions = [Aggregation.USER, Aggregation.ACTIVITY_TYPE];
    
    for (const timeUnit of timeUnits) {
      try {
        const latestUpdate = await MaterializedStats.getLatestUpdateDate(this.db, timeUnit);
        let fromDate: Date;
        
        if (latestUpdate) {
          // Use the latest update date if materialized data exists
          fromDate = latestUpdate;
        } else {
          // If no materialized data exists, start from the very first audit entry
          const earliestAuditDate = await Audit.getEarliestDate(this.db);
          fromDate = earliestAuditDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Fallback to 1 year ago if no audit data
          
          if (earliestAuditDate) {
            console.log(`No materialized data found for ${timeUnit}, starting from first audit entry: ${earliestAuditDate.toISOString()}`);
          } else {
            console.log(`No audit data found, using fallback date: ${fromDate.toISOString()}`);
          }
        }
        
        const toDate = new Date();
        console.log(`Aggregating missing ${timeUnit} data from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
        
        for (const aggregateBy of aggregateByOptions) {
          const stats = await this.aggregateForDateRange(
            fromDate,
            toDate,
            timeUnit,
            eventTypes,
            aggregateBy
          );

          if (stats.length > 0) {
            await MaterializedStats.bulkInsert(this.db, timeUnit, stats);
            console.log(`Inserted ${stats.length} ${timeUnit} stats records for ${aggregateBy}`);
          }
        }
      } catch (error) {
        console.error(`Error aggregating missing ${timeUnit} data:`, error);
      }
    }
  }
}
