import { r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IUser } from "../../../shared/types/user";
import { IActant } from "../../../shared/types/actant";
import { Db } from "./RethinkDB";
import { IAction, IStatement, ITerritory } from "@shared/types";
import { IDbModel } from "@models/common";
import { ModelNotValidError } from "@shared/types/errors";
import { ActantType } from "@shared/enums";
import { regExpEscape } from "@common/functions";

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
  return rethink.table("users").get(userId).update(safeData).run(db.connection);
}

export async function deleteUser(db: Db, userId: string): Promise<WriteResult> {
  return rethink.table("users").get(userId).delete().run(db.connection);
}

// ACTANT
export async function getStatementsForTerritory(
  db: Db,
  terId: string
): Promise<IStatement[]> {
  return rethink
    .table("actants")
    .filter({
      class: "S",
    })
    .filter(function (territory: any) {
      return rethink.and(
        territory("data")("territory").typeOf().eq("OBJECT"),
        territory("data")("territory")("id").eq(terId)
      );
    })
    .run(db.connection);
}

export async function getActants<T = IAction | IStatement | ITerritory>(
  db: Db,
  filter: object = {}
): Promise<T[]> {
  return rethink.table("actants").filter(filter).run(db.connection);
}

export async function getTerritoryChilds(
  db: Db,
  parentId: string
): Promise<ITerritory[]> {
  return rethink
    .table("actants")
    .filter(function (territory: any) {
      return rethink.and(
        territory("data")("parent").typeOf().eq("OBJECT"),
        territory("data")("parent")("id").eq(parentId)
      );
    })
    .run(db.connection);
}

export async function findActantById<T extends IActant>(
  db: Db,
  id: string,
  additionalFilter: Record<string, unknown> = {}
): Promise<T> {
  const data = await rethink
    .table("actants")
    .filter({
      ...additionalFilter,
      id,
    })
    .limit(1)
    .run(db.connection);
  return data.length == 0 ? null : data[0];
}

export async function findActantsByIds<T extends IActant>(
  db: Db,
  ids: string[]
): Promise<T[]> {
  const data = await rethink
    .table("actants")
    .getAll(rethink.args(ids))
    .run(db.connection);

  return data;
}

export async function findActants<T extends IActant>(
  db: Db,
  additionalFilter: Record<string, unknown> = {}
): Promise<T[]> {
  return await rethink
    .table("actants")
    .filter(additionalFilter)
    .run(db.connection);
}

export async function getActantUsage(db: Db, id: string): Promise<number> {
  return await rethink
    .table("actants")
    .filter({
      class: "S",
    })
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("actant").eq(id)
      );
    })
    .count()
    .run(db.connection);
}

export async function findActantsById(
  db: Db,
  ids: string[]
): Promise<IActant[]> {
  const data = await rethink
    .table("actants")
    .getAll(...ids)
    .run(db.connection);
  return data;
}

export async function createActant(
  db: Db,
  data: IDbModel
): Promise<WriteResult> {
  if (!data.isValid()) {
    throw new ModelNotValidError("");
  }
  return data.save(db.connection);
}

export async function deleteActant(
  db: Db,
  actantId: string
): Promise<WriteResult> {
  return rethink.table("actants").get(actantId).delete().run(db.connection);
}

export async function findAssociatedActantIds(
  db: Db,
  actantId: string
): Promise<string[]> {
  const statements = await rethink
    .table("actants")
    .filter({
      class: ActantType.Statement,
    })
    .filter(function (row: RDatum) {
      return rethink.or(
        row("data")("actants").contains((actantObj: RDatum) =>
          actantObj("actant").eq(actantId)
        ),
        row("data")("actions").contains((actionObj: RDatum) =>
          actionObj("action").eq(actantId)
        )
      );
    })
    .run(db.connection);

  const actantIds: string[] = [];

  (statements as IStatement[]).forEach((s) => {
    const ids = s.data.actants.map((a) => a.actant);
    actantIds.push(...ids);
  });

  return actantIds;
}

export async function filterActantsByWildcard(
  db: Db,
  actantClass: ActantType | false,
  actantLabel: string | false,
  actantIds?: string[]
): Promise<IActant[]> {
  let query = rethink.table("actants");

  if (actantIds && actantIds.length) {
    query = query.getAll(rethink.args(actantIds)) as any;
  }

  if (actantClass) {
    query = query.filter({
      class: actantClass,
    });
  }

  if (actantLabel) {
    query = query.filter(function (row: RDatum) {
      return row("label")
        .downcase()
        .match(`^${regExpEscape(actantLabel.toLowerCase())}`);
    });
  }

  return query.run(db.connection);
}

// ACTIONS
export async function findAllActions(db: Db): Promise<IAction[]> {
  return await rethink.table("actions").run(db.connection);
}

export async function findActionById(db: Db, id: string): Promise<IAction> {
  const data = await rethink
    .table("actions")
    .filter({
      id,
    })
    .limit(1)
    .run(db.connection);
  return data.length == 0 ? null : data[0];
}

export async function findActionsByLabel(
  db: Db,
  label: string
): Promise<IAction[]> {
  const data = await rethink
    .table("actions")
    .filter(function (user: any) {
      return rethink
        .row("labels")
        .contains<IAction>((labelObj) => labelObj("value").eq(label));
    })
    .run(db.connection);
  return data;
}

export async function createAction(
  db: Db,
  data: IAction,
  keepId?: boolean
): Promise<WriteResult> {
  const safeData: any = { ...data };
  if (!keepId) {
    delete safeData.id;
  }
  return rethink.table("actions").insert(safeData).run(db.connection);
}

export async function updateAction(
  db: Db,
  actionId: string,
  data: IAction
): Promise<WriteResult> {
  const safeData: any = { ...data };
  delete safeData.id;
  return rethink
    .table("actions")
    .get(actionId)
    .update(safeData)
    .run(db.connection);
}

export async function deleteAction(
  db: Db,
  actionId: string
): Promise<WriteResult> {
  return rethink.table("actions").get(actionId).delete().run(db.connection);
}

export async function deleteActants(db: Db): Promise<WriteResult> {
  return rethink.table("actants").delete().run(db.connection);
}

export async function deleteActions(db: Db): Promise<WriteResult> {
  return rethink.table("actions").delete().run(db.connection);
}
