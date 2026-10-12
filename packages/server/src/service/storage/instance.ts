import { createRethinkStorage } from "./rethink";
import { Storage } from "./types";

// The single process-wide storage every call site uses.
export const storage: Storage = createRethinkStorage();
