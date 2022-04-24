import { r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
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
  entityIds?: string[],
  onlyTemplates?: boolean,
  usedTemplate?: string
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

  if (usedTemplate) {
    query = query.filter({
      usedTemplate: usedTemplate,
    });
  }

  if (onlyTemplates) {
    query = query.filter({
      isTemplate: true,
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
    let leftWildcard: string = "^",
      rightWildcard: string = "$";

    if (entityLabel[0] === "*") {
      leftWildcard = "";
      entityLabel = entityLabel.slice(1);
    }

    if (entityLabel[entityLabel.length - 1] === "*") {
      rightWildcard = "";
      entityLabel = entityLabel.slice(0, -1);
    }

    entityLabel = regExpEscape(entityLabel.toLowerCase());

    query = query.filter(function (row: RDatum) {
      return row("label")
        .downcase()
        .match(`${leftWildcard}${entityLabel}${rightWildcard}`);
    });
  }

  return query.run(db.connection);
}

export async function deleteEntities(db: Db): Promise<WriteResult> {
  return rethink.table(Entity.table).delete().run(db.connection);
}
