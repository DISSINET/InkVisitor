import { r as rethink, WriteResult } from "rethinkdb-ts";
import { IUser } from "../../../shared/types/user";
import { IActant } from "../../../shared/types/actant";

import { Db } from "./RethinkDB";
import { IAction, ILabel, IStatement, ITerritory } from "@shared/types";

// USER
export async function findAllUsers(db: Db): Promise<IUser[]> {
  return await rethink.table("users").run(db.connection);
}

export async function findUserByName(db: Db, name: string): Promise<IUser> {
  const data = await rethink
    .table("users")
    .filter({
      name,
    })
    .limit(1)
    .run(db.connection);
  return data.length == 0 ? null : data[0];
}

export async function findUserById(db: Db, id: string): Promise<IUser> {
  const data = await rethink
    .table("users")
    .filter({
      id,
    })
    .limit(1)
    .run(db.connection);
  return data.length == 0 ? null : data[0];
}

export async function findUsersByLabel(
  db: Db,
  label: string
): Promise<IUser[]> {
  const data = await rethink
    .table("users")
    .filter(function (user: any) {
      return rethink.or(
        rethink.row("name").eq(label),
        rethink.row("email").eq(label)
      );
    })
    .run(db.connection);
  return data;
}

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

export async function findActantsByLabelOrClass(
  db: Db,
  label: string,
  classParam: string
): Promise<IActant[]> {
  const data = await rethink
    .table("actants")
    .filter(function (user: any) {
      return rethink.or(
        rethink.row("class").eq(classParam),
        rethink
          .row("labels")
          .contains<ILabel>((labelObj) => labelObj("value").eq(label))
      );
    })
    .run(db.connection);
  return data;
}

export async function createActant<T = IActant | IStatement>(
  db: Db,
  data: T,
  keepId?: boolean
): Promise<WriteResult> {
  const safeData: any = { ...data };
  if (!keepId) {
    delete safeData.id;
  }
  return rethink.table("actants").insert(safeData).run(db.connection);
}

export async function updateActant(
  db: Db,
  actantId: string,
  data: IActant
): Promise<WriteResult> {
  const safeData: any = { ...data };
  delete safeData.id;
  return rethink
    .table("actants")
    .get(actantId)
    .update(safeData)
    .run(db.connection);
}

export async function deleteActant(
  db: Db,
  actantId: string
): Promise<WriteResult> {
  return rethink.table("actants").get(actantId).delete().run(db.connection);
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
