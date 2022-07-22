import { testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { successfulGenericResponse } from "@modules/common.test";
import { supertestConfig } from "..";

describe("Users create", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", (done) => {
      return request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ name: "tester", email: "tester@dissinet.cz", password: "pass" })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200, done);
    });
  });
});
