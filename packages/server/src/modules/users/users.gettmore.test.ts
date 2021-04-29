import { testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { supertestConfig } from "..";

describe("Users getMore", function () {
  describe("Empty body", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Ok body with faulty params ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ label: "" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Ok body with ok label", () => {
    it("should return a 200 code with successful response", (done) => {
      return request(app)
        .post(`${apiPath}/users/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
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
