import { Storage } from "../types";
import {
  assertConfigured,
  assertRequiredIndexes,
  closeConnection,
  createDatabase,
  dropDatabase,
  isOpen,
  openConnection,
  ping,
  tableList,
} from "./conn";
import { watch } from "./invalidation";
import SearchNode from "./query/nodes";
import { sessions } from "./sessions";
import { entities, relations } from "./entities";
import { acl, audits, documents, savedQueries, settings, stats, users } from "./tables";

/** The PostgreSQL implementation of the storage boundary (#3256). */
export function createPostgresStorage(): Storage {
  return {
    kind: "postgres",
    assertConfigured,
    openConnection,
    closeConnection,
    isOpen,
    ping,
    tableList,
    assertRequiredIndexes,
    createDatabase,
    dropDatabase,
    watch,
    entities,
    relations,
    audits,
    users,
    documents,
    acl,
    settings,
    savedQueries,
    stats,
    sessions,
    explore: {
      plan(query, resolvers) {
        return new SearchNode(query, resolvers);
      },
    },
  };
}
