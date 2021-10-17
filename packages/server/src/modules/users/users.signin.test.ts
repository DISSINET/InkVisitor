import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";

describe("Users signin", function () {
  describe("Empty body", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .send({ username: "fake", password: "fake" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        )
        .then(() => done());
    });
  });
  describe("Ok body with ok user", () => {
    it("should return a 200 code with successful response", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .send({ username: "admin", password: "admin" })
        .expect("Content-Type", /json/)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("token");
          res.body.token.should.not.empty;
        })
        .expect(200, done);
    });
  });
});
