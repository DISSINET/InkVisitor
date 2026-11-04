import { Query } from "@inkvisitor/shared/types/query";
import { ExploreResolvers, Storage } from "../types";
import { watch } from "./changefeeds";
import {
  assertConfigured,
  closeConnection,
  isOpen,
  openConnection,
  ping,
  tableList,
} from "./conn";
import { assertRequiredIndexes, createDatabase, dropDatabase } from "./provision";
import SearchNode from "./query/nodes";
import { sessions } from "./sessions";
import {
  acl,
  audits,
  documents,
  entities,
  relations,
  savedQueries,
  settings,
  stats,
  users,
} from "./tables";

/** The RethinkDB implementation of the storage boundary. */
export function createRethinkStorage(): Storage {
  return {
    kind: "rethinkdb",
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
      plan(query: Query.INode, resolvers: ExploreResolvers) {
        return new SearchNode(query, resolvers);
      },
    },
  };
}
