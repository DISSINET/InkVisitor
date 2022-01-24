import "../settings"; // Must be the first import

import { generateAccessToken } from "@common/auth";
import User from "@models/user/user";
import { Db } from "@service/RethinkDB";

(async () => {
  const db = new Db();
  await db.initDb();

  const users = await User.findAllUsers(db.connection);
  users.forEach((u) => {
    console.log(u.email, generateAccessToken(u));
  });

  await db.close();
})();
