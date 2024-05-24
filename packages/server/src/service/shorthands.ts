import { Connection, r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IEntity, IUser } from "@shared/types";
import { Db } from "./rethink";
import { IDbModel } from "@models/common";
import { ModelNotValidError } from "@shared/types/errors";
import { DbEnums, EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import User from "@models/user/user";
import Relation from "@models/relation/relation";
import Audit from "@models/audit/audit";
import Document from "@models/document/document";

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
  db: Db | Connection,
  id: string
): Promise<T> {
  const connection = db instanceof Db ? db.connection : db;
  const data = await rethink.table(Entity.table).get(id).run(connection);
  return data || null;
}

export async function createEntity(db: Db, data: IDbModel): Promise<boolean> {
  if (!data.isValid()) {
    throw new ModelNotValidError("");
  }
  return data.save(db.connection);
}

export async function deleteEntities(db: Db): Promise<WriteResult> {
  return rethink.table(Entity.table).delete().run(db.connection);
}

export async function deleteAudits(db: Db): Promise<WriteResult> {
  return rethink.table(Audit.table).delete().run(db.connection);
}

export async function deleteRelations(db: Db): Promise<WriteResult> {
  return rethink.table(Relation.table).delete().run(db.connection);
}

export async function deleteUsers(db: Db): Promise<WriteResult> {
  return rethink
    .table(User.table)
    .filter(function (user: RDatum<IUser>) {
      return user("name").ne("admin");
    })
    .delete()
    .run(db.connection);
}

export async function deleteDocuments(db: Db): Promise<WriteResult> {
  return rethink.table(Document.table).delete().run(db.connection);
}
