import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import { IResponseEntity } from "@inkvisitor/shared/types";

describe("Entities batch method", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Missing IDs array", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .post(`${apiPath}/entities/batch`)
        .send({})
        .expect(testErroneousResponse.bind(undefined, new BadParams("ids array must be provided")));
    });
  });

  describe("Empty IDs array", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .post(`${apiPath}/entities/batch`)
        .send({ ids: [] })
        .expect(testErroneousResponse.bind(undefined, new BadParams("ids array must be provided")));
    });
  });

  describe("Non-existent IDs", () => {
    it("should return an empty array", async () => {
      await authAgent
        .post(`${apiPath}/entities/batch`)
        .send({ ids: ["non-existent-id"] })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe("Valid IDs", () => {
    it("should return entity data for valid IDs", async () => {
      const db = new Db();
      await db.initDb();

      // Create test entities
      const statementId1 = `test-statement-${Math.random().toString()}`;
      const statementId2 = `test-statement-${Math.random().toString()}`;
      
      const entity1 = new Statement({
        id: statementId1,
        data: new StatementData({
          territory: new StatementTerritory({
            territoryId: "test-territory-1",
          }),
        }),
      });

      const entity2 = new Statement({
        id: statementId2,
        data: new StatementData({
          territory: new StatementTerritory({
            territoryId: "test-territory-2",
          }),
        }),
      });

      await entity1.save(db.connection);
      await entity2.save(db.connection);

      // Test batch endpoint
      await authAgent
        .post(`${apiPath}/entities/batch`)
        .send({ ids: [statementId1, statementId2] })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          
          // Verify the returned entities match our created ones
          const foundIds = res.body.map((entity: IResponseEntity) => entity.id);
          expect(foundIds).toContain(statementId1);
          expect(foundIds).toContain(statementId2);
        });

      await clean(db);
    });
  });
});
