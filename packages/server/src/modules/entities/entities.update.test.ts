import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import { IEntity } from "@shared/types";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { successfulGenericResponse } from "@modules/common.test";

describe("Entities update", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/entities/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return an EntityDoesNotExist error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/entities/1`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();
      const changeLabelTo = "new label";
      const statementData = new Statement({
        id: testId,
        label: "",
        data: new StatementData({
          territory: new StatementTerritory({ territoryId: testId + "ter" }),
        }),
      });
      await statementData.save(db.connection);

      await request(app)
        .put(`${apiPath}/entities/${testId}`)
        .send({ label: changeLabelTo })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(successfulGenericResponse)
        .expect(async () => {
          const changedEntry = await findEntityById<IEntity>(db, testId);
          expect(changedEntry.label).toEqual(changeLabelTo);
        });

      await clean(db);
      done();
    });
  });
});
