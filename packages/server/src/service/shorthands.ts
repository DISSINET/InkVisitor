import { Connection, r as rethink, WriteResult } from "rethinkdb-ts";
import { IUser } from "../../../shared/types/user";
import { Db } from "./RethinkDB";

// USER

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
