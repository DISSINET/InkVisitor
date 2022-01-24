import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { ModelNotValidError } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import Statement from "@models/statement/statement";
import {
  deleteActants,
  findActantById,
  findActants,
} from "@service/shorthands";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory/territory";
import "ts-jest";

describe("Actants create", function () {
  describe("empty data", () => {
    it("should return a ModelNotValid error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/create`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/create`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("ok statement data", () => {
    it("should return a 200 code with successful responsedsd", async (done) => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const actantData = new Statement({
        id: statementRandomId,
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });

      await request(app)
        .post(`${apiPath}/actants/create`)
        .send(actantData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
      done();
    });
  });
  describe("create territory data with predefined id", () => {
    it("should create the entry with provided id", async (done) => {
      const db = new Db();
      await db.initDb();

      const randomId = Math.random().toString();
      const territoryData = new Territory({
        id: randomId,
      });

      await request(app)
        .post(`${apiPath}/actants/create`)
        .send(territoryData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const createdActantData = await findActantById(db, randomId);
      expect(createdActantData).not.toBeNull();

      await clean(db);
      done();
    });
  });

  describe("create territory data without predefined id", () => {
    it("should create the entry with new id", async (done) => {
      const db = new Db();
      await db.initDb();
      await deleteActants(db);

      const territoryData = new Territory({ label: "22323" });

      await request(app)
        .post(`${apiPath}/actants/create`)
        .send(territoryData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const allActants = await findActants(db);
      expect(allActants).toHaveLength(1);
      expect(allActants[0].id).not.toBe("");
      expect(allActants[0].label).toBe(territoryData.label);

      await clean(db);
      done();
    });
  });
});
