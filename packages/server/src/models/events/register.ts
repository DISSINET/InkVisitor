import Statement from "@models/statement/statement";
import emitter from "./emitter";
import { EventTypes, EventMapSingle } from "./types";

export interface EmittableModel {
  events: EventMapSingle;
}

// sorry about this
const hookers: EmittableModel[] = [Statement];

let registered = false;
const registerHooks = () => {
  if (registered) {
    return false;
  }

  hookers.forEach((h) => {
    for (const key in h.events) {
      const cb = h.events[key as EventTypes];
      if (cb) {
        emitter.on(key as EventTypes, cb);
      }
    }
  });
  registered = true;
};

registerHooks();
