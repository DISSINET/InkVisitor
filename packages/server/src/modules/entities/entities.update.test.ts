import { apiPath } from "@common/constants";
import { pool } from "@middlewares/db";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import { IEntity } from "@inkvisitor/shared/types";
import { BadParams, EntityDoesNotExist } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import app from "../../server";

describe("Entities update", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/entities/1`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("faulty data ", () => {
    it("should return an EntityDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/entities/1`)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        );
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();
      const changeLabelTo = "new label";
      const statementData = new Statement({
        id: testId,
        labels: ["test"],
        data: new StatementData({
          territory: new StatementTerritory({ territoryId: testId + "ter" }),
        }),
      });
      await statementData.save(db.connection);

      await authAgent
        .put(`${apiPath}/entities/${testId}`)
        .send({ labels: [changeLabelTo] })
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(successfulGenericResponse)
        .expect(async () => {
          const changedEntry = await findEntityById<IEntity>(db, testId);
          expect(changedEntry.labels[0]).toEqual(changeLabelTo);
        });

      await clean(db);
    });
  });
});
