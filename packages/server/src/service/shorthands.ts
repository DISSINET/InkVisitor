import { Connection, r as rethink } from "rethinkdb-ts";
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
