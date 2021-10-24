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

  emit(type: EventTypes, db: Connection, actantId: string) {
    if (this.registered[type]) {
      for (const cb of this.registered[type] as EmitterCb[]) {
        cb(db, actantId);
      }
    }
  }
}

export default new Emitter();
