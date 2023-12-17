import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { pool } from "@middlewares/db";

describe("Users signin", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty body", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ username: "fake", password: "fake" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });
  describe("Ok body with ok user", () => {
    it("should return a 200 code with successful response", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ username: "admin", password: "admin" })
        .expect("Content-Type", /json/)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("token");
          res.body.token.should.not.empty;
        })
        .expect(200);
    });
  });
});
