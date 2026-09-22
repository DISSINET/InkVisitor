import { createRethinkStorage } from "./rethink";
import { Storage } from "./types";

// RethinkDB is the only backend today. The PostgreSQL adapter (#3256) hooks in
// here, selected by environment, without touching any call site.
export const storage: Storage = createRethinkStorage();
