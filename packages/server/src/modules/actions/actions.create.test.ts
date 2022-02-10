import { testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { IAction } from "@shared/types";
import { successfulGenericResponse } from "@modules/common.test";
import Action from "@models/action/action";

describe("Actions create", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actions/create`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actions/create`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const rand = Math.random().toString();
      const actionData = new Action({ id: `action-${rand}` });
      request(app)
        .post(`${apiPath}/actions/create`)
        .send(actionData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .then(() => done());
    });
  });
});
