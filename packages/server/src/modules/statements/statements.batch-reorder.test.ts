import { createMockTree, testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import Statement, { StatementTerritory } from "@models/statement/statement";
import treeCache from "@service/treeCache";
import { pool } from "@middlewares/db";

describe("statements/batch-reorder", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty/Invalid params", () => {
    it("should return a BadParams error wrapped in IResponseGeneric for empty params", async () => {
      await request(app)
        .put(`${apiPath}/statements/batch-reorder`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("Provided params", () => {
    const db = new Db();
    const randSuffix = Math.random().toString();
    let rootId = "";

    beforeAll(async () => {
      await db.initDb();
      await createMockTree(db, randSuffix);
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();
      rootId = `root-${randSuffix}`;
    });

    afterAll(async () => {
      await db.close();
    });

    it("should return StatementDoesNotExits for unknown statement id", async () => {
      await request(app)
        .put(`${apiPath}/statements/batch-reorder`)
        .send({ updates: [{ id: "missing-id", order: 100 }] })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new StatementDoesNotExits("", ""))
        );
    });

    it("should update statement orders in one request", async () => {
      const statement1 = new Statement({});
      const statement2 = new Statement({});
      statement1.data.territory = new StatementTerritory({
        territoryId: rootId,
        order: 100,
      });
      statement2.data.territory = new StatementTerritory({
        territoryId: rootId,
        order: 200,
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      await request(app)
        .put(`${apiPath}/statements/batch-reorder`)
        .send({
          updates: [
            { id: statement1.id, order: 200 },
            { id: statement2.id, order: 100 },
          ],
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((resp) => !!resp.body.result);

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.data.territory.order).toEqual(200);
      expect(statement2After.data.territory.order).toEqual(100);
    });
  });
});
