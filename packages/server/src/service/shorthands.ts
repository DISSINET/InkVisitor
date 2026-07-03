import Audit from "@models/audit/audit";
import { IDbModel } from "@models/common";
import Document from "@models/document/document";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import User, { USER_CACHE_KEY_PREFIX } from "@models/user/user";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IUser } from "@inkvisitor/shared/types";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import { Connection, RDatum, r as rethink, WriteResult } from "rethinkdb-ts";
import { Db, rethinkConfig } from "./rethink";
import { DbHandle } from "./dbHandle";
import { cache } from "./ttlCache";

// A database name is only considered safe to wipe if it is unmistakably a
// throwaway test DB. Matches `inkvisitor_test`, `iv_test_*`, `test_*`, etc.
const TEST_DB_PATTERN = /(^iv_test_)|(_test$)|(^test_)/i;

/**
 * Safety guard for the full-table wipe helpers below. Each of them deletes
 * EVERY row of a table and is only ever called from test setup/teardown.
 * Refuse to run unless the connected database is clearly a disposable test DB
 * - otherwise a misconfigured DB_NAME (e.g. the real `inkvisitor` dev DB
 * leaking in via a stray shell export, or an unfixed env/.env.test) would
 * silently and irreversibly destroy a developer's working data (RethinkDB has
 * no transactions, so there is no rollback).
 *
 * Escape hatch: set ALLOW_DB_WIPE=1 to override intentionally (e.g. dedicated
 * reset tooling against a known-disposable instance).
 */
function assertTestDb(): void {
  if (process.env.ALLOW_DB_WIPE === "1") {
    return;
  }
  const dbName = rethinkConfig.db || "";
  if (!TEST_DB_PATTERN.test(dbName)) {
    throw new Error(
      `Refusing to wipe tables on non-test database "${dbName}". ` +
        `Full-table delete helpers may only target a disposable test DB ` +
        `(name matching ${TEST_DB_PATTERN}). Point DB_NAME at a test database ` +
        `(e.g. inkvisitor_test) or set ALLOW_DB_WIPE=1 to override.`
    );
  }
}

const ENTITY_CACHE_TTL_MS = 60 * 1000;
export const ENTITY_CACHE_KEY_PREFIX = "entity:byId:";
export const entityCacheKey = (id: string): string =>
  `${ENTITY_CACHE_KEY_PREFIX}${id}`;

export async function getEntitiesDataByClass<T>(
  db: Connection,
  entityClass: EntityEnums.Class
): Promise<T[]> {
  const connection = db instanceof Db ? db.connection : db;
  return rethink
    .table(Entity.table)
    .getAll(entityClass, { index: DbEnums.Indexes.Class })
    .run(connection);
}

export async function findEntityById<T extends IEntity>(
  db: Db | DbHandle | Connection,
  id: string
): Promise<T> {
  const key = entityCacheKey(id);
  // Snapshot before the DB read so any concurrent invalidation that fires
  // between here and the trySet below is detected.
  const version = cache.snapshot(key);
  const cached = cache.get<IEntity>(key);
  if (cached) {
    return cached as T;
  }

  const connection = "connection" in db ? db.connection : db;
  const data = await rethink.table(Entity.table).get(id).run(connection);
  if (!data) {
    return null as unknown as T;
  }

  // trySet refuses if a writer invalidated the key while our read was
  // in flight; in that case we still return what we read, but we don't
  // poison the cache with potentially stale data.
  cache.trySet(key, data as IEntity, ENTITY_CACHE_TTL_MS, version);
  return data;
}

export async function getEntitiesByIds<T extends IEntity>(
  db: Connection,
  ids: string[]
): Promise<T[]> {
  return rethink
    .table(Entity.table)
    .getAll(...ids)
    .run(db);
}

export async function createEntity(db: Db | DbHandle, data: IDbModel): Promise<boolean> {
  if (!data.isValid()) {
    throw new ModelNotValidError("");
  }
  return data.save(db.connection);
}

export async function deleteEntities(db: Db | DbHandle): Promise<WriteResult> {
  assertTestDb();
  const result = await rethink.table(Entity.table).delete().run(db.connection);
  // Bulk wipe bypasses Entity.delete/update, so invalidate every cached
  // entity entry. Used by test setup but safe to fire in any context.
  cache.deletePrefix(ENTITY_CACHE_KEY_PREFIX);
  return result;
}

export async function deleteAudits(db: Db | DbHandle): Promise<WriteResult> {
  assertTestDb();
  return rethink.table(Audit.table).delete().run(db.connection);
}

export async function deleteRelations(db: Db | DbHandle): Promise<WriteResult> {
  assertTestDb();
  return rethink.table(Relation.table).delete().run(db.connection);
}

export async function deleteUsers(db: Db | DbHandle): Promise<WriteResult> {
  assertTestDb();
  const result = await rethink
    .table(User.table)
    .filter(function (user: RDatum<IUser>) {
      return user("name").ne("admin");
    })
    .delete()
    .run(db.connection);
  // Bulk wipe bypasses User.delete/update; clear the user cache namespace.
  // Admin's entry is also cleared (over-eager by one row); the next read
  // for admin will repopulate from the DB.
  cache.deletePrefix(USER_CACHE_KEY_PREFIX);
  return result;
}

export async function deleteDocuments(db: Db | DbHandle): Promise<WriteResult> {
  assertTestDb();
  return rethink.table(Document.table).delete().run(db.connection);
}
