import { testErroneousResponse } from "@modules/common.test";
import { BadCredentialsError, BadParams } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { pool } from "@middlewares/db";

describe("Users signin", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty body", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a BadCredentials error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ login: "fake", password: "fake" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new BadCredentialsError(""))
        );
    });
  });
  describe("Ok body with ok user", () => {
    it("should return a 200 code with successful response", async () => {
      const res = await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ login: "admin", password: "admin" })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body).toBeTruthy();
      expect(typeof res.body).toBe("object");
      expect(res.body.id).toBeTruthy();
    });
  });
});
