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
    // Snap the lower bound back to the start of its bucket so the whole bucket
    // is recomputed (bulkInsert replaces rows, so a partial bucket would
    // otherwise overwrite the full one). The upper bound stays at midnight,
    // which excludes the current (open) day.
    const fromDateTruncated = StatsAggregator.startOfBucket(fromDate, timeUnit);
    const toDateTruncated = StatsAggregator.truncateToMidnight(toDate);

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
  static truncateToMidnight(date: Date): Date {
    const truncated = new Date(date);
    truncated.setHours(0, 0, 0, 0);
    return truncated;
  }

  /**
   * Returns the start of the time bucket that contains the given date, in UTC
   * (matching the bucket keys, which are derived from toISO8601 in UTC).
   *
   * Used as the aggregation lower bound so a partial re-aggregation (e.g. the
   * nightly incremental run starting mid-year) recomputes the *whole* current
   * bucket. Otherwise bulkInsert's conflict:"replace" would overwrite a full
   * year/month/week bucket with only the delta since the last run.
   */
  static startOfBucket(date: Date, timeUnit: TimeUnit): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    switch (timeUnit) {
      case TimeUnit.DAY:
        return new Date(Date.UTC(year, month, day));
      case TimeUnit.WEEK: {
        const dayStart = Date.UTC(year, month, day);
        const dayOfWeek = new Date(dayStart).getUTCDay(); // 0=Sun..6=Sat
        const daysFromMonday = (dayOfWeek + 6) % 7;
        return new Date(dayStart - daysFromMonday * 24 * 60 * 60 * 1000);
      }
      case TimeUnit.MONTH:
        return new Date(Date.UTC(year, month, 1));
      case TimeUnit.YEAR:
        return new Date(Date.UTC(year, 0, 1));
      default:
        throw new Error("Invalid time unit");
    }
  }

  /**
   * Aggregates missing data for all time units from the last update date
   */
  async aggregateMissingData(): Promise<void> {
    const timeUnits = [TimeUnit.DAY, TimeUnit.WEEK, TimeUnit.MONTH, TimeUnit.YEAR];
    const eventTypes = Object.values(EventType);
    const aggregateByOptions = [Aggregation.USER, Aggregation.ACTIVITY_TYPE];
    
    for (const timeUnit of timeUnits) {
      const unitStart = Date.now();
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
            console.log(`[stats-cron] ${timeUnit}: no materialized data, starting from first audit entry ${earliestAuditDate.toISOString()}`);
          } else {
            console.log(`[stats-cron] ${timeUnit}: no audit data, using fallback date ${fromDate.toISOString()}`);
          }
        }

        const toDate = new Date();
        // The window actually scanned: lower bound snapped to the bucket start,
        // upper bound truncated to midnight (today is excluded).
        const scanFrom = StatsAggregator.startOfBucket(fromDate, timeUnit);
        const scanTo = StatsAggregator.truncateToMidnight(toDate);

        let recordsForUnit = 0;
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
            recordsForUnit += stats.length;
          }
        }

        console.log(
          `[stats-cron] ${timeUnit}: ${recordsForUnit} records in ${Date.now() - unitStart}ms (scanned ${scanFrom.toISOString()} → ${scanTo.toISOString()})`
        );
      } catch (error) {
        console.error(
          `[stats-cron] ${timeUnit}: failed after ${Date.now() - unitStart}ms`,
          error
        );
      }
    }
  }
}
