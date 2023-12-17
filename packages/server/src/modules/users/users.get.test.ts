import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { supertestConfig } from "..";
import { pool } from "@middlewares/db";

describe("Users get", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/users/`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/users/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async () => {
      await request(app)
        .get(`${apiPath}/users/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.property("id");
          res.body.id.should.not.empty;
        })
        .expect(200);
    });
  });
});
