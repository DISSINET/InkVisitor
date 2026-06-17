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

  describe("Empty param", () => {
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
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.property("id");
          res.body.id.should.not.empty;
        })
        .expect(200);
    });
  });
});
