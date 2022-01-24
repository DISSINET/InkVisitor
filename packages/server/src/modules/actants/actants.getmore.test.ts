import { testErroneousResponse, clean } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request, { Response } from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Statement from "@models/statement/statement";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory/territory";

const expectNonEmptyArrayOfActants = (res: Response) => {
  expect(res.body.constructor.name).toBe("Array");
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0].id).toBeTruthy();
};

const expectEmptyArrayOfActants = (res: Response) => {
  expect(res.body.constructor.name).toEqual("Array");
  expect(res.body).toHaveLength(0);
};

describe("Actants getMore", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: "", class: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong label param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const actantData = new Statement({
        label: "testlabel",
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });
      await actantData.save(db.connection);

      await request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: actantData.label + "somethingdifferent" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(expectEmptyArrayOfActants);

      await clean(db);
      done();
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const actantData = new Statement({
        label: "testlabel",
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });
      await actantData.save(db.connection);

      await request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: actantData.label })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(expectNonEmptyArrayOfActants);

      await clean(db);
      done();
    });
  });
  describe("Correct class param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const territoryData = new Territory({});
      await territoryData.save(db.connection);

      await request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ class: "T" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(expectNonEmptyArrayOfActants);

      await clean(db);
      done();
    });
  });
  describe("Correct both class & label params", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const actantData = new Statement({
        id: statementRandomId,
        label: "testlabel" + statementRandomId,
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });

      await actantData.save(db.connection);

      await request(app)
        .post(`${apiPath}/actants/getMore`)
        .send({ label: actantData.label, class: actantData.class })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(expectNonEmptyArrayOfActants);

      await clean(db);
      done();
    });
  });
});
