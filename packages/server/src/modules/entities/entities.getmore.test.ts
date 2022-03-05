import { testErroneousResponse, clean } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request, { Response } from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Statement from "@models/statement/statement";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory/territory";

const expectNonEmptyArrayOfEntities = (res: Response) => {
  expect(res.body.constructor.name).toBe("Array");
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0].id).toBeTruthy();
};

const expectEmptyArrayOfEntities = (res: Response) => {
  expect(res.body.constructor.name).toEqual("Array");
  expect(res.body).toHaveLength(0);
};

describe("Entities getMore", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/getMore`)
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

      const entityData = new Statement({
        label: "testlabel",
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });
      await entityData.save(db.connection);

      await request(app)
        .post(`${apiPath}/entities/getMore`)
        .send({ label: entityData.label + "somethingdifferent" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(expectEmptyArrayOfEntities);

      await clean(db);
      done();
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const entityData = new Statement({
        label: "testlabel",
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });
      await entityData.save(db.connection);

      await request(app)
        .post(`${apiPath}/entities/getMore`)
        .send({ label: entityData.label })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(expectNonEmptyArrayOfEntities);

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
        .post(`${apiPath}/entities/getMore`)
        .send({ class: "T" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(expectNonEmptyArrayOfEntities);

      await clean(db);
      done();
    });
  });
  describe("Correct both class & label params", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const entityData = new Statement({
        id: statementRandomId,
        label: "testlabel" + statementRandomId,
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });

      await entityData.save(db.connection);

      await request(app)
        .post(`${apiPath}/entities/getMore`)
        .send({ label: entityData.label, class: entityData.class })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(expectNonEmptyArrayOfEntities);

      await clean(db);
      done();
    });
  });
});
