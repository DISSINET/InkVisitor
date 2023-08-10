import { IDbModel, UnknownObject, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IAudit } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import { IRequest } from "../../custom_typings/request";
import { DbEnums } from "@shared/enums";

export default class Audit implements IAudit, IDbModel {
  static table = "audits";

  id = "";
  entityId = "";
  userId = "";
  date: Date = new Date();
  changes: object = {};

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data });
    this.changes = data.changes as object;
  }

  /**
   * Stores the audit in the db
   * @param db db connection
   * @returns boolean to indicate result of the operation
   */
  async save(db: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(Audit.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Connection
   * @param updateData Promise<WriteResult>
   */
  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be updated");
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Connection
   * @param updateData Promise<WriteResult>
   */
  async delete(db: Connection): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be deleted");
  }

  /**
   * Predicate for testing if the Audit entry is valid
   * @returns boolean
   */
  isValid(): boolean {
    return true;
  }

  /**
   * Combines Audit constructor and save method to immediately create & persist in the db
   * @param req IRequest
   * @param entityId
   * @param updateData blob containing snapshot of entity data
   * @returns Promise<boolean>
   */
  static async createNew(
    req: IRequest,
    entityId: string,
    updateData: object
  ): Promise<boolean> {
    const entry = new Audit({
      entityId,
      user: req.getUserOrFail().id,
      changes: updateData,
    });
    return entry.save(req.db.connection);
  }

  /**
   * Retrieves first created audit entry for entity.
   * First audit entry stands for created-at entry.
   * @param db rethinkdb Connection
   * @param entityId string
   * @returns Promise<Audit | null>
   */
  static async getFirstForEntity(
    db: Connection,
    entityId: string
  ): Promise<Audit | null> {
    const result = await rethink
      .table(Audit.table)
      .getAll(entityId, { index: DbEnums.Indexes.AuditEntityId })
      .orderBy(rethink.asc("date"))
      .limit(1)
      .run(db);

    return result && result.length ? new Audit(result[0]) : null;
  }

  /**
   * Retrieves last created audit entry for entity.
   * Last audit entry stands for updated-at entry.
   * @param db rethinkdb Connection
   * @param entityId string
   * @returns Promise<Audit | null>
   */
  static async getLastForEntity(
    db: Connection,
    entityId: string
  ): Promise<Audit | null> {
    const result = await rethink
      .table(Audit.table)
      .getAll(entityId, { index: DbEnums.Indexes.AuditEntityId })
      .orderBy(rethink.desc("date"))
      .limit(1)
      .run(db);

    return result && result.length ? new Audit(result[0]) : null;
  }

  /**
   * Retrieves N audits for entity, ordered by date DESC (last N items)
   * @param dbConn rethinkdb Connection
   * @param entityId string
   * @param n limit for returned entries
   * @returns Promise<Audit[]>
   */
  static async getLastNForEntity(
    dbConn: Connection,
    entityId: string,
    n = 5
  ): Promise<Audit[]> {
    const result = await rethink
      .table(Audit.table)
      .getAll(entityId, { index: DbEnums.Indexes.AuditEntityId })
      .orderBy(rethink.desc("date"))
      .limit(n)
      .run(dbConn);

    return result.map((r) => new Audit(r));
  }

  /**
   * Retrieved Audit entries that are first entries for respective entity, effectively searching for entities created
   * on particular date
   * @param db rethinkdb Connection
   * @param date created date
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByCreatedDate(db: Connection, date: Date): Promise<Audit[]> {
    const result = await rethink
      .table(Audit.table)
      .filter(rethink.row("date").date().eq(date))
      .run(db);

    const audits = result.map((data) => new Audit(data)) as Audit[];
    const byEntity = Object.values(
      audits.reduce((acc, curr) => {
        if (!acc[curr.entityId] || acc[curr.entityId].date > curr.date) {
          acc[curr.entityId] = curr;
        }
        return acc;
      }, {} as Record<string, Audit>)
    );

    const withValidDate: Audit[] = [];
    for (const audit of byEntity) {
      const firstAudit = await Audit.getFirstForEntity(db, audit.entityId);
      if (
        firstAudit &&
        firstAudit.date.toISOString().split("T")[0] ===
          audit.date.toISOString().split("T")[0]
      ) {
        withValidDate.push(firstAudit);
      }
    }

    return withValidDate;
  }

  /**
   * Retrieved Audit entries that are last entries for respective entity, effectively searching for entities updated
   * on particular date
   * @param db rethinkdb Connection
   * @param date updated date
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByUpdatedDate(db: Connection, date: Date): Promise<Audit[]> {
    const result = await rethink
      .table(Audit.table)
      .filter(rethink.row("date").date().eq(date))
      .run(db);

    const audits = result.map((data) => new Audit(data)) as Audit[];
    const byEntity = Object.values(
      audits.reduce((acc, curr) => {
        if (!acc[curr.entityId] || acc[curr.entityId].date > curr.date) {
          acc[curr.entityId] = curr;
        }
        return acc;
      }, {} as Record<string, Audit>)
    );

    const withValidDate: Audit[] = [];
    for (const audit of byEntity) {
      const firstAudit = await Audit.getLastForEntity(db, audit.entityId);
      if (
        firstAudit &&
        firstAudit.date.toISOString().split("T")[0] ===
          audit.date.toISOString().split("T")[0]
      ) {
        withValidDate.push(firstAudit);
      }
    }

    return withValidDate;
  }
}
