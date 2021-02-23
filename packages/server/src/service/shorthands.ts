import { Connection, r as rethink, WriteResult } from "rethinkdb-ts";
import { UserI } from "../../../shared/types/user";
import { Db } from "./RethinkDB";

export async function findUserByName(db: Db, name: string): Promise<UserI> {
  const data = await rethink
    .table("users")
    .filter({
      name,
    })
    .limit(1)
    .run(db.connection);
  return data.length == 0 ? null : data[0];
}

export async function findUserById(db: Db, id: string): Promise<UserI> {
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
): Promise<UserI[]> {
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

export async function createUser(db: Db, data: UserI): Promise<WriteResult> {
  return rethink.table("users").insert(data).run(db.connection);
}

export async function updateUser(
  db: Db,
  userId: string,
  data: UserI
): Promise<WriteResult> {
  const safeData: any = { ...data };
  delete safeData.id;
  return rethink.table("users").get(userId).update(safeData).run(db.connection);
}
