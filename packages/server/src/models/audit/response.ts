import { r as rethink, Connection } from "rethinkdb-ts";
import { IAudit, IResponseAudit } from "@shared/types";
import Audit from "./audit";
import { DbIndex } from "@shared/enums";

export class ResponseAudit implements IResponseAudit {
  entity: string;
  last: IAudit[];
  first?: IAudit;

  constructor(entityId: string) {
    this.entity = entityId;
    this.last = [];
  }

  /**
   * Retrieves N audits for entity, ordered by date DESC (last N items)
   * @param dbConn rethinkdb Connection
   * @param n limit for returned entries
   * @returns Promise<void>
   */
  async getLastNForEntity(dbConn: Connection, n: number = 5): Promise<void> {
    const result = await rethink
      .table(Audit.table)
      .getAll(this.entity, { index: DbIndex.AuditEntityId })
      .orderBy(rethink.desc("date"))
      .limit(n)
      .run(dbConn);

    if (!result || !result.length) {
      this.last = [];
      return;
    }

    this.last = result.map((r) => new Audit(r));
  }

  /**
   * Retrieves first created audit entry for entity.
   * First audit entry stands for created-at entry.
   * @param db rethinkdb Connection
   * @returns Promise<void>
   */
  async getFirstForEntity(db: Connection): Promise<void> {
    const result = await rethink
      .table(Audit.table)
      .getAll(this.entity, { index: DbIndex.AuditEntityId })
      .orderBy(rethink.asc("date"))
      .limit(1)
      .run(db);

    if (!result || !result.length) {
      this.first = undefined;
      return;
    }

    this.first = new Audit(result[0]);
  }
}
