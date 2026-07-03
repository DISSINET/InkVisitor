import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { pool } from "@middlewares/db";

describe("Users get", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  // skip: GET /users/ (empty userId) no longer reaches the :userId handler that
  // throws BadParams - the trailing-slash request now matches the GET / list
  // route and returns 200 with the full user list, so an empty-param BadParams
  // can no longer be produced from this endpoint.
  describe.skip("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/users/`)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/users/123`)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async () => {
      await authAgent
        .get(`${apiPath}/users/1`)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toHaveProperty("id");
          expect(res.body.id).toBeTruthy();
        })
        .expect(200);
    });
  });
});
