import { Connection } from "rethinkdb-ts";
import { EventTypes, EmitterCb, EventMap } from "./types";

class Emitter {
  registered: EventMap = {};

  constructor() {}

  on(type: EventTypes, cb: EmitterCb) {
    if (!this.registered[type]) {
      this.registered[type] = [];
    }
    this.registered[type]?.push(cb);
  }

  async emit(type: EventTypes, db: Connection, entityId: string) {
    if (this.registered[type]) {
      for (const cb of this.registered[type] as EmitterCb[]) {
        await cb(db, entityId);
      }
    }
  }
}

export default new Emitter();
