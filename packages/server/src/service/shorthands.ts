import { r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IUser } from "@shared/types/user";
import { IEntity } from "@shared/types";
import { Db } from "./RethinkDB";
import { IAction, IStatement, ITerritory } from "@shared/types";
import { IDbModel } from "@models/common";
import { ModelNotValidError } from "@shared/types/errors";
import { DbIndex, EntityClass } from "@shared/enums";
import Entity from "@models/entity/entity";
import User from "@models/user/user";

export async function deleteUser(db: Db, userId: string): Promise<WriteResult> {
  return rethink.table(User.table).get(userId).delete().run(db.connection);
}

export async function getEntitiesDataByClass<T>(
  db: Db,
  entityClass: EntityClass
): Promise<T[]> {
  return rethink
    .table(Entity.table)
    .getAll(entityClass, { index: DbIndex.Class })
    .run(db.connection);
}

export async function findEntityById<T extends IEntity>(
  db: Db,
  id: string
): Promise<T> {
  const data = await rethink.table(Entity.table).get(id).run(db.connection);
  return data || null;
}

export async function createEntity(
  db: Db,
  data: IDbModel
): Promise<WriteResult> {
  if (!data.isValid()) {
    throw new ModelNotValidError("");
  }
  return data.save(db.connection);
}

export async function deleteEntities(db: Db): Promise<WriteResult> {
  return rethink.table(Entity.table).delete().run(db.connection);
}
