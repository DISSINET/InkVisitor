import { BadParams, UserDoesNotExits } from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
const should = chai.should();

describe("Users getMore", function () {
  describe("Empty body", () => {
    it("should return a 400 code with bad params error", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a 200 code with successful response", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .send({ label: "" })
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Ok body with ok label", () => {
    it("should return a 200 code with successful response", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .send({ label: "admin" })
        .expect("Content-Type", /json/)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("array");
          res.body.should.have.lengthOf.above(0);
          res.body[0].should.have.property("id");
          res.body[0].id.should.not.empty;
        })
        .expect(200, done);
    });
  });
});
