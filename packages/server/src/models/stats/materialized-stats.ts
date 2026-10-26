import { IDbModel, fillFlatObject } from "@models/common";
import { Conn, WriteResult, storage } from "@service/storage";
import { EventType, Aggregation } from "@inkvisitor/shared/types/stats";
import { expandEventTypesForStats } from "./event-type-fold";

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
  async save(db: Conn | undefined, timeUnit: string): Promise<boolean> {
    const result = await storage
      .stats(timeUnit)
      .insert(db as Conn, { ...this, id: this.id || undefined }, { conflict: "replace" });

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1 || result.replaced === 1;
  }

  /**
   * Updates existing materialized stats
   */
  update(
    db: Conn | undefined,
    updateData: Record<string, unknown>,
    timeUnit: string
  ): Promise<WriteResult> {
    return storage.stats(timeUnit).update(db as Conn, this.id, updateData);
  }

  /**
   * Deletes materialized stats entry
   */
  async delete(db: Conn, timeUnit: string): Promise<WriteResult> {
    return storage.stats(timeUnit).delete(db, this.id);
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
    db: Conn,
    timeUnit: string,
    fromDate: Date,
    toDate: Date,
    eventTypes: EventType[],
    aggregateBy: Aggregation
  ): Promise<MaterializedStats[]> {
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    const result = await storage
      .stats(timeUnit)
      .byDateRange(db, fromDateStr, toDateStr, expandEventTypesForStats(eventTypes), aggregateBy);

    return result.map((data) => new MaterializedStats(data));
  }

  /**
   * Gets the latest lastUpdated date for a time unit
   */
  static async getLatestUpdateDate(
    db: Conn,
    timeUnit: string
  ): Promise<Date | null> {
    return storage.stats(timeUnit).latestUpdate(db);
  }

  /**
   * Bulk insert materialized stats
   */
  static async bulkInsert(
    db: Conn,
    timeUnit: string,
    stats: IMaterializedStats[]
  ): Promise<WriteResult> {
    return storage.stats(timeUnit).insert(db, stats, { conflict: "replace" });
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
