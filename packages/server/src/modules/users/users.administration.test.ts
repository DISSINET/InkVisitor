import "@modules/common.test";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { supertestConfig } from "..";
import { pool } from "@middlewares/db";

describe("Users administration", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Default check", () => {
    it("should return a 200 code", async () => {
      await request(app)
        .get(`${apiPath}/users/administration`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("users");
          res.body.users.should.be.a("array");
        });
    });
  });
});
