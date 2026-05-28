import Audit from "@models/audit/audit";
import { IDbModel } from "@models/common";
import Document from "@models/document/document";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import User from "@models/user/user";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IUser } from "@inkvisitor/shared/types";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import { Connection, RDatum, r as rethink, WriteResult } from "rethinkdb-ts";
import { Db } from "./rethink";
import { DbHandle } from "./dbHandle";
import { cache } from "./ttlCache";

const ENTITY_CACHE_TTL_MS = 60 * 1000;
export const entityCacheKey = (id: string): string => `entity:byId:${id}`;

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
  return rethink.table(Entity.table).delete().run(db.connection);
}

export async function deleteAudits(db: Db | DbHandle): Promise<WriteResult> {
  return rethink.table(Audit.table).delete().run(db.connection);
}

export async function deleteRelations(db: Db | DbHandle): Promise<WriteResult> {
  return rethink.table(Relation.table).delete().run(db.connection);
}

export async function deleteUsers(db: Db | DbHandle): Promise<WriteResult> {
  return rethink
    .table(User.table)
    .filter(function (user: RDatum<IUser>) {
      return user("name").ne("admin");
    })
    .delete()
    .run(db.connection);
}

export async function deleteDocuments(db: Db | DbHandle): Promise<WriteResult> {
  return rethink.table(Document.table).delete().run(db.connection);
}
