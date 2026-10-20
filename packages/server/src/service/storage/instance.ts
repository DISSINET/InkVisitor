import { adapterFromEnv } from "./config";
import { createPostgresStorage } from "./postgres";
import { createRethinkStorage } from "./rethink";
import { Storage } from "./types";

// Selected once per process from DB_ADAPTER; RethinkDB is the default. Both
// adapters implement the same Storage surface, so no call site knows which
// one it talks to.
export const storage: Storage =
  adapterFromEnv() === "postgres" ? createPostgresStorage() : createRethinkStorage();
