import { BadParams, UserDoesNotExits } from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
const should = chai.should();

describe("Users signin", function () {
  describe("Empty body", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a 400 code with UserDoesNotExits error", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .send({ username: "fake", password: "fake" })
        .expect("Content-Type", /json/)
        .expect({ error: new UserDoesNotExits("whatever").toString() })
        .expect(400, done);
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
