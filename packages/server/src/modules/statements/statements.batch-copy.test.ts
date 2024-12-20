import { testErroneousResponse, createMockTree } from "@modules/common.test";
import {
  BadParams,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import Statement, { StatementTerritory } from "@models/statement/statement";
import treeCache from "@service/treeCache";
import { pool } from "@middlewares/db";

describe("statements/batch-copy", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty/Invalid params", () => {
    it("should return a BadParams error wrapped in IResponseGeneric for empty params", async () => {
      await request(app)
        .post(`${apiPath}/statements/batch-copy`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing territory id", async () => {
      await request(app)
        .post(`${apiPath}/statements/batch-copy?ids=1,2,3`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing ids", async () => {
      await request(app)
        .post(`${apiPath}/statements/batch-copy`)
        .send({ territoryId: "1" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("Provided params", () => {
    const db = new Db();
    const randSuffix = Math.random().toString();
    let rootId = "";
    let T1Id = "";

    beforeAll(async () => {
      await db.initDb();
      await createMockTree(db, randSuffix);
      treeCache.tree = await treeCache.createTree(db);
      rootId = `root-${randSuffix}`;
      T1Id = `T1-${randSuffix}`;
    });

    afterAll(async () => {
      await db.close();
    });

    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric for invalid id", async () => {
      await request(app)
        .post(`${apiPath}/statements/batch-copy?ids=1`)
        .send({ territoryId: "random-something" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new TerritoryDoesNotExits("", "")
          )
        );
    });

    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric for invalid id", async () => {
      await request(app)
        .post(`${apiPath}/statements/batch-copy?ids=1`)
        .send({ territoryId: treeCache.tree.parentMap[""][0].id })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        );
    });

    it("should return a successful IResponseGeneric for valid ids while using the same territory", async () => {
      const statement1 = new Statement({});
      const statement2 = new Statement({});
      statement1.data.territory = new StatementTerritory({
        territoryId: rootId,
      });
      statement2.data.territory = new StatementTerritory({
        territoryId: rootId,
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      await request(app)
        .post(
          `${apiPath}/statements/batch-copy?ids=${statement1.id},${statement2.id}`
        )
        .send({ territoryId: rootId })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((resp) => !!resp.body.result);
    });

    it("should return a successful IResponseGeneric for valid ids while using new territory", async () => {
      const statement1 = new Statement({});
      const statement2 = new Statement({});
      statement1.data.territory = new StatementTerritory({
        territoryId: rootId,
      });
      statement2.data.territory = new StatementTerritory({
        territoryId: rootId,
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const response = await request(app)
        .post(
          `${apiPath}/statements/batch-copy?ids=${statement1.id},${statement2.id}`
        )
        .send({ territoryId: T1Id })
        .set("authorization", "Bearer " + supertestConfig.token);
      expect(response.body.result).toBeTruthy();
      expect(response.body.data).toHaveLength(2); // 2 statements

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement1.id);
      expect(statement1After.data.territory.territoryId).toEqual(rootId);
      expect(statement2After.data.territory.territoryId).toEqual(rootId);

      const statement1AfterCopy = await findEntityById(
        db,
        response.body.data[0]
      );
      const statement2AfterCopy = await findEntityById(
        db,
        response.body.data[1]
      );
      expect(statement1AfterCopy.data.territory.territoryId).toEqual(T1Id);
      expect(statement2AfterCopy.data.territory.territoryId).toEqual(T1Id);
    });
  });
});
