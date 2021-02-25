import {
  ActantDoesNotExits,
  BadParams,
  UserDoesNotExits,
} from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IAction } from "@shared/types";
const should = chai.should();

const checkArrayOfActions = (res: any) => {
  const actionExample: IAction = {
    id: "",
    labels: [],
    note: "",
    parent: "",
    rulesActants: [],
    rulesProperties: [],
    types: [],
    valencies: [],
  };
  res.body.should.not.empty;
  res.body.should.be.a("array");
  res.body.should.have.lengthOf.above(0);
  res.body[0].should.have.keys(Object.keys(actionExample));
  res.body[0].id.should.not.empty;
};

describe("Actions getMore", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actions/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actions/getMore`)
        .send({ label: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with user response", (done) => {
      return request(app)
        .post(`${apiPath}/actions/getMore`)
        .send({ label: "said" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(checkArrayOfActions)
        .expect(200, done);
    });
  });
});
