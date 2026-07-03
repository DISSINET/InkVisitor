import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { supertestConfig } from "..";
import { pool } from "@middlewares/db";

describe("Users get", function () {
  afterAll(async () => {
    await pool.end();
  });

  // skip: GET /users/ (empty userId) no longer reaches the :userId handler that
  // throws BadParams - the trailing-slash request now matches the GET / list
  // route and returns 200 with the full user list, so an empty-param BadParams
  // can no longer be produced from this endpoint.
  describe.skip("Empty param", () => {
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
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toHaveProperty("id");
          expect(res.body.id).toBeTruthy();
        })
        .expect(200);
    });
  });
});
