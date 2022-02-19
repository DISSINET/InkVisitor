import { Connection, r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IUser } from "@shared/types/user";
import { IEntity } from "@shared/types";
import { Db } from "./RethinkDB";
import { IAction, IStatement, ITerritory } from "@shared/types";
import { IDbModel } from "@models/common";
import { ModelNotValidError } from "@shared/types/errors";
import { EntityClass } from "@shared/enums";
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

// ENTITY
export async function getStatementsForTerritory(
  db: Db,
  terId: string
): Promise<IStatement[]> {
  return rethink
    .table(Entity.table)
    .filter({
      class: EntityClass.Statement,
    })
    .filter(function (territory: any) {
      return rethink.and(
        territory("data")("territory").typeOf().eq("OBJECT"),
        territory("data")("territory")("id").eq(terId)
      );
    })
    .run(db.connection);
}

export async function getEntities<
  T = IAction | IStatement | ITerritory | IEntity
>(db: Db, filter: object = {}): Promise<T[]> {
  return rethink.table(Entity.table).filter(filter).run(db.connection);
}

export async function getTerritoryChilds(
  db: Db,
  parentId: string
): Promise<ITerritory[]> {
  return rethink
    .table(Entity.table)
    .filter(function (territory: any) {
      return rethink.and(
        territory("data")("parent").typeOf().eq("OBJECT"),
        territory("data")("parent")("id").eq(parentId)
      );
    })
    .run(db.connection);
}

export async function findEntityById<T extends IEntity>(
  db: Db,
  id: string,
  additionalFilter: Record<string, unknown> = {}
): Promise<T> {
  const data = await rethink
    .table(Entity.table)
    .filter({
      ...additionalFilter,
      id,
    })
    .limit(1)
    .run(db.connection);

  return data.length == 0 ? null : data[0];
}

export async function findEntitiesByIds<T extends IEntity>(
  db: Db | Connection,
  ids: string[]
): Promise<T[]> {
  const query = rethink.table(Entity.table).getAll(rethink.args(ids));

  if ((db as Db).connection) {
    return query.run((db as Db).connection);
  } else {
    return query.run(db as Connection);
  }
}

export async function findEntities<T extends IEntity>(
  db: Db,
  additionalFilter: Record<string, unknown> = {}
): Promise<T[]> {
  return await rethink
    .table(Entity.table)
    .filter(additionalFilter)
    .run(db.connection);
}

export async function getEntityUsage(db: Db, id: string): Promise<number> {
  return await rethink
    .table(Entity.table)
    .filter({
      class: EntityClass.Statement,
    })
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("actant").eq(id)
      );
    })
    .count()
    .run(db.connection);
}

export async function findEntitiesById(
  db: Db,
  ids: string[]
): Promise<IEntity[]> {
  const data = await rethink
    .table(Entity.table)
    .getAll(...ids)
    .run(db.connection);
  return data;
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

export async function deleteEntity(
  db: Db,
  entityId: string
): Promise<WriteResult> {
  return rethink.table(Entity.table).get(entityId).delete().run(db.connection);
}

export async function findAssociatedEntityIds(
  db: Db,
  entityId: string
): Promise<string[]> {
  const statements = await rethink
    .table(Entity.table)
    .filter({
      class: EntityClass.Statement,
    })
    .filter(function (row: RDatum) {
      return rethink.or(
        row("data")("actants").contains((actantObj: RDatum) =>
          actantObj("actant").eq(entityId)
        ),
        row("data")("actions").contains((actionObj: RDatum) =>
          actionObj("action").eq(entityId)
        )
      );
    })
    .run(db.connection);

  const entityIds: string[] = [];

  (statements as IStatement[]).forEach((s) => {
    const ids = s.data.actants.map((a) => a.actant);
    entityIds.push(...ids);
  });

  return entityIds;
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
