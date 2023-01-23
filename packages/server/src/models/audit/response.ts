import { Connection } from "rethinkdb-ts";
import { IAudit, IResponseAudit } from "@shared/types";
import Audit from "./audit";

export class ResponseAudit implements IResponseAudit {
  entityId: string;
  last: IAudit[];
  first?: IAudit;

  constructor(entityId: string) {
    this.entityId = entityId;
    this.last = [];
  }

  /**
   * Fills fields for this response
   * @param db rethinkdb Connection
   * @returns Promise<void>
   */
  async prepare(db: Connection): Promise<void> {
    this.last = await Audit.getLastNForEntity(db, this.entityId, 5);
    if (this.last.length) {
      const firstEntity = await Audit.getFirstForEntity(db, this.entityId);
      if (firstEntity) {
        this.first = firstEntity;
      }
    }
  }
}
