import { testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { pool } from "@middlewares/db";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { IUser } from "@shared/types";

describe("Users getMore", function () {
  let allUsers: User[];

  beforeAll(async () => {
    const db = new Db();
    await db.initDb();
    allUsers = await User.findAllUsers(db.connection);
    await db.close();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Ok body with faulty params ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/users?label=`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body).toHaveLength(allUsers.length);
        });
    });
  });
  describe("Ok body with ok label", () => {
    it("should return a 200 code with successful response", async () => {
      await request(app)
        .get(`${apiPath}/users?label=admin`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body).toHaveLength(
            allUsers.filter((u) => u.name === "admin").length
          );
          expect(res.body[0]).toHaveProperty("id");
        })
        .expect(200);
    });
  });
});
