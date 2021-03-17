import "@modules/common.test";
import { BadParams } from "@common/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";

const checkArrayOfActants = (res: any) => {
  res.body.should.not.empty;
  res.body.should.be.a("array");
  res.body.should.have.lengthOf.above(0);
  res.body[0].should.have.keys(["id", "class", "labels", "data"]);
  res.body[0].id.should.not.empty;
};

describe("Actants getMore", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: "", class: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with user response", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: "Chapter 1" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(checkArrayOfActants)
        .expect(200, done);
    });
  });
  describe("Correct class param", () => {
    it("should return a 200 code with user response", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ class: "T" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(checkArrayOfActants)
        .expect(200, done);
    });
  });
  describe("Correct both class & label params", () => {
    it("should return a 200 code with user response", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ class: "S", label: "Chapter 1" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(checkArrayOfActants)
        .expect(200, done);
    });
  });
});
