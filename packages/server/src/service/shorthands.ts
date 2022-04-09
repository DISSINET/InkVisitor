import { Connection, r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IUser } from "@shared/types/user";
import { IEntity } from "@shared/types";
import { Db } from "./RethinkDB";
import { IAction, IStatement, ITerritory } from "@shared/types";
import { IDbModel } from "@models/common";
import { ModelNotValidError } from "@shared/types/errors";
import { DbIndex, EntityClass } from "@shared/enums";
import { regExpEscape } from "@common/functions";
import Entity from "@models/entity/entity";
import User from "@models/user/user";

export async function createUser(db: Db, data: IUser): Promise<WriteResult> {
  return rethink.table("users").insert(data).run(db.connection);
}

export async function updateUser(
  db: Db,
  userId: string,
  data: IUser
): Promise<WriteResult> {
  const safeData: any = { ...data };
  delete safeData.id;
  return rethink
    .table(User.table)
    .get(userId)
    .update(safeData)
    .run(db.connection);
}

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

export async function filterEntitiesByWildcard(
  db: Db,
  entityClass: EntityClass | false,
  entityClassExcluded: EntityClass[] | undefined,
  entityLabel: string | false,
  entityIds?: string[]
): Promise<IEntity[]> {
  let query = rethink.table(Entity.table);

  if (entityIds && entityIds.length) {
    query = query.getAll(rethink.args(entityIds)) as any;
  }

  if (entityClass) {
    query = query.filter({
      class: entityClass,
    });
  }

  if (entityClassExcluded) {
    query = query.filter(function (row: RDatum) {
      return rethink.and.apply(
        rethink,
        entityClassExcluded.map((c) => row("class").ne(c)) as [
          RDatum<boolean>,
          ...RDatum<boolean>[]
        ]
      );
    });
  }

  if (entityLabel) {
    query = query.filter(function (row: RDatum) {
      return row("label")
        .downcase()
        .match(`${regExpEscape(entityLabel.toLowerCase())}`);
    });
  }

  return query.run(db.connection);
}

export async function deleteEntities(db: Db): Promise<WriteResult> {
  return rethink.table(Entity.table).delete().run(db.connection);
}
