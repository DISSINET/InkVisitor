import { IDbModel, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { EventType, Aggregation } from "@inkvisitor/shared/types/stats";

export interface IMaterializedStats {
  id: string;
  date: string; // ISO date at start of period (YYYY-MM-DD)
  eventType: EventType;
  aggregateBy: Aggregation;
  aggregationKey: string; // userId or activityType value
  count: number;
  lastUpdated: Date;
}

export class MaterializedStats implements IMaterializedStats {
  static tablePrefix = "stats_materialized_";
  
  id = "";
  date = "";
  eventType = EventType.EDIT;
  aggregateBy = Aggregation.USER;
  aggregationKey = "";
  count = 0;
  lastUpdated = new Date();

  constructor(data: Partial<IMaterializedStats>) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data });
  }

  /**
   * Gets the table name for a specific time unit
   */
  static getTableName(timeUnit: string): string {
    return `${MaterializedStats.tablePrefix}${timeUnit}`;
  }

  /**
   * Stores the materialized stats in the db
   */
  async save(db: Connection | undefined, timeUnit: string): Promise<boolean> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    const result = await rethink
      .table(tableName)
      .insert({ ...this, id: this.id || undefined }, { conflict: "replace" })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1 || result.replaced === 1;
  }

  /**
   * Updates existing materialized stats
   */
  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>,
    timeUnit: string
  ): Promise<WriteResult> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    return rethink
      .table(tableName)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  /**
   * Deletes materialized stats entry
   */
  async delete(db: Connection, timeUnit: string): Promise<WriteResult> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    return rethink
      .table(tableName)
      .get(this.id)
      .delete()
      .run(db);
  }

  /**
   * Predicate for testing if the MaterializedStats entry is valid
   */
  isValid(): boolean {
    return !!(
      this.date &&
      this.eventType &&
      this.aggregateBy &&
      this.aggregationKey &&
      this.count >= 0
    );
  }

  /**
   * Finds materialized stats by date range and filters
   */
  static async findByDateRange(
    db: Connection,
    timeUnit: string,
    fromDate: Date,
    toDate: Date,
    eventTypes: EventType[],
    aggregateBy: Aggregation
  ): Promise<MaterializedStats[]> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    const result = await rethink
      .table(tableName)
      .between(fromDateStr, toDateStr, { index: "date" })
      .filter((doc: any) =>
        rethink.expr(eventTypes).contains(doc("eventType"))
      )
      .filter((doc: any) => doc("aggregateBy").eq(aggregateBy))
      .orderBy("date")
      .run(db);

    return result.map((data) => new MaterializedStats(data));
  }

  /**
   * Gets the latest lastUpdated date for a time unit
   */
  static async getLatestUpdateDate(
    db: Connection,
    timeUnit: string
  ): Promise<Date | null> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    
    try {
      const result = await rethink
        .table(tableName)
        .max("lastUpdated")
        .run(db);

      return result ? new Date((result as any).lastUpdated) : null;
    } catch (error) {
      // Table might not exist yet
      return null;
    }
  }

  /**
   * Bulk insert materialized stats
   */
  static async bulkInsert(
    db: Connection,
    timeUnit: string,
    stats: IMaterializedStats[]
  ): Promise<WriteResult> {
    const tableName = MaterializedStats.getTableName(timeUnit);
    return rethink
      .table(tableName)
      .insert(stats, { conflict: "replace" })
      .run(db);
  }

  /**
   * Creates a unique ID for the materialized stats entry
   */
  static generateId(
    date: string,
    eventType: EventType,
    aggregateBy: Aggregation,
    aggregationKey: string
  ): string {
    return `${date}_${eventType}_${aggregateBy}_${aggregationKey}`;
  }
}
