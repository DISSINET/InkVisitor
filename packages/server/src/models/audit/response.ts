import { r as rethink, Connection } from "rethinkdb-ts";
import { IAudit, IResponseAudit } from "@shared/types";
import Audit from "./audit";

export class ResponseAudit implements IResponseAudit {
  entity: string;
  last: IAudit[];
  first?: IAudit;

  constructor(entityId: string) {
    this.entity = entityId;
    this.last = [];
  }

  async getLastNForEntity(dbConn: Connection, n: number = 5): Promise<void> {
    const result = await rethink
      .table(Audit.table)
      .filter({ entityId: this.entity })
      .orderBy(rethink.desc("date"))
      .limit(n)
      .run(dbConn);

    if (!result || !result.length) {
      this.last = [];
      return;
    }

    this.last = result.map((r) => new Audit(r));
  }

  async getFirstForEntity(db: Connection): Promise<void> {
    const result = await rethink
      .table(Audit.table)
      .filter({ entityId: this.entity })
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
