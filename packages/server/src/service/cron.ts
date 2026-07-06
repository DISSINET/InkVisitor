import * as cron from "node-cron";
import { Connection } from "rethinkdb-ts";
import { StatsAggregator } from "@models/stats/stats-aggregator";
import { EventType } from "@inkvisitor/shared/types/stats";
import { reapExpiredSessions } from "@service/rethinkSessionStore";

export class CronService {
  private db: Connection;
  private statsAggregator: StatsAggregator;
  private isRunning = false;

  constructor(db: Connection) {
    this.db = db;
    this.statsAggregator = new StatsAggregator(db);
  }

  /**
   * Starts the cron service with midnight job
   */
  start(): void {
    if (this.isRunning) {
      console.log("Cron service is already running");
      return;
    }

    // Run at midnight every day (00:00)
    const task = cron.schedule("0 0 * * *", async () => {
      console.log("Starting midnight stats aggregation job...");
      await this.runStatsAggregation();
    }, {
      timezone: "UTC"
    });

    task.start();

    // Reap expired sessions hourly so abandoned sessions don't pile up in the
    // sessions table (active ones are also cleaned lazily on access).
    const sessionReapTask = cron.schedule(
      "0 * * * *",
      async () => {
        await this.runSessionReap();
      },
      {
        timezone: "UTC",
      }
    );

    sessionReapTask.start();
    this.isRunning = true;

    console.log(
      "Cron service started - stats aggregation daily at midnight UTC, expired-session reap hourly"
    );
  }

  /**
   * Stops the cron service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("Cron service is not running");
      return;
    }

    cron.getTasks().forEach(task => {
      task.stop();
    });
    
    this.isRunning = false;
    console.log("Cron service stopped");
  }

  /**
   * Runs the stats aggregation job manually
   */
  async runStatsAggregation(): Promise<void> {
    const runDate = new Date().toISOString().slice(0, 10);
    const startTime = Date.now();
    try {
      console.log(`[stats-cron] ${runDate}: starting stats aggregation`);

      await this.statsAggregator.aggregateMissingData();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[stats-cron] ${runDate}: stats aggregation failed after ${duration}ms`,
        error
      );
    }
  }

  /**
   * Deletes expired sessions from the RethinkDB session store.
   */
  async runSessionReap(): Promise<void> {
    const startTime = Date.now();
    try {
      const deleted = await reapExpiredSessions(this.db);
      if (deleted > 0) {
        console.log(`[session-reap] removed ${deleted} expired session(s)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[session-reap] failed after ${duration}ms`, error);
    }
  }

  /**
   * Runs initial aggregation for all historical data
   */
  async runInitialAggregation(): Promise<void> {
    try {
      console.log("Starting initial stats aggregation...");
      const startTime = Date.now();
      
      // Aggregate data for the last 3 years (matching the default client behavior)
      const fromDate = new Date();
      fromDate.setFullYear(fromDate.getFullYear() - 3);
      const toDate = new Date();
      
      const eventTypes = Object.values(EventType);
      const aggregateByOptions = ["user", "activityType"] as any[];
      
      for (const aggregateBy of aggregateByOptions) {
        await this.statsAggregator.aggregateAllTimeUnits(
          fromDate,
          toDate,
          eventTypes,
          aggregateBy
        );
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Initial stats aggregation completed successfully in ${duration}ms`);
    } catch (error) {
      console.error("Error during initial stats aggregation:", error);
    }
  }

  /**
   * Manually triggers aggregation for a specific date range
   */
  async triggerAggregation(
    fromDate: Date,
    toDate: Date,
    timeUnits?: string[],
    aggregateBy?: string[]
  ): Promise<{ message: string; recordsProcessed: number }> {
    try {
      console.log(`Manual aggregation triggered from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
      
      const eventTypes = Object.values(EventType);
      const targetTimeUnits = timeUnits || ["day", "week", "month", "year"];
      const targetAggregateBy = aggregateBy || ["user", "activityType"];
      
      let totalRecordsProcessed = 0;

      for (const timeUnit of targetTimeUnits) {
        for (const aggBy of targetAggregateBy) {
          const stats = await this.statsAggregator.aggregateForDateRange(
            fromDate,
            toDate,
            timeUnit as any,
            eventTypes,
            aggBy as any
          );

          if (stats.length > 0) {
            await this.statsAggregator.aggregateAllTimeUnits(
              fromDate,
              toDate,
              eventTypes,
              aggBy as any
            );
            totalRecordsProcessed += stats.length;
          }
        }
      }

      const message = `Manual aggregation completed. Processed ${totalRecordsProcessed} records from ${fromDate.toISOString()} to ${toDate.toISOString()}.`;
      
      return {
        message,
        recordsProcessed: totalRecordsProcessed
      };
    } catch (error) {
      console.error("Error during manual aggregation:", error);
      throw error;
    }
  }

  /**
   * Gets the status of the cron service
   */
  getStatus(): { isRunning: boolean; tasks: string[] } {
    const tasks = Array.from(cron.getTasks().values()).map((task: any) => task.getStatus());
    return {
      isRunning: this.isRunning,
      tasks: tasks
    };
  }
}
