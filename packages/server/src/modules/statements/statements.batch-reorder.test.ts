import { createMockTree, testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@inkvisitor/shared/types/errors";
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
        .expect(200)
        .expect((resp) => {
          expect(resp.body.result).toBe(true);
        });

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.data.territory.order).toEqual(200);
      expect(statement2After.data.territory.order).toEqual(100);
    });

    it("should persist the exact order values requested, even when they collide with existing orders", async () => {
      const s1 = new Statement({});
      const s2 = new Statement({});
      const s3 = new Statement({});
      s1.data.territory = new StatementTerritory({ territoryId: rootId, order: 10 });
      s2.data.territory = new StatementTerritory({ territoryId: rootId, order: 20 });
      s3.data.territory = new StatementTerritory({ territoryId: rootId, order: 30 });
      await s1.save(db.connection);
      await s2.save(db.connection);
      await s3.save(db.connection);

      // Reverse the order: s1->30, s2->20, s3->10. Every target collides
      // with an existing sibling — the legacy code path produced fractional
      // orders here.
      await request(app)
        .put(`${apiPath}/statements/batch-reorder`)
        .send({
          updates: [
            { id: s1.id, order: 30 },
            { id: s2.id, order: 20 },
            { id: s3.id, order: 10 },
          ],
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

      const after1 = await findEntityById(db, s1.id);
      const after2 = await findEntityById(db, s2.id);
      const after3 = await findEntityById(db, s3.id);
      expect(after1.data.territory.order).toBe(30);
      expect(after2.data.territory.order).toBe(20);
      expect(after3.data.territory.order).toBe(10);
    });

    it(
      "should handle reordering many statements in a single request",
      async () => {
      const N = 50;
      const stmts: Statement[] = [];
      for (let i = 0; i < N; i++) {
        const s = new Statement({});
        s.data.territory = new StatementTerritory({
          territoryId: rootId,
          order: 1000 + i, // far from other tests' values to avoid cross-test interference
        });
        await s.save(db.connection);
        stmts.push(s);
      }

      // Reverse them
      const updates = stmts.map((s, i) => ({
        id: s.id,
        order: 1000 + (N - 1 - i),
      }));

      const start = Date.now();
      await request(app)
        .put(`${apiPath}/statements/batch-reorder`)
        .send({ updates })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);
      const elapsedMs = Date.now() - start;

      // Generous bound — pre-fix this would balloon with `treeCache.initialize()`
      // disabled in tests but is still fine. Mostly a regression guard against
      // anyone reintroducing per-row sibling lookups.
      expect(elapsedMs).toBeLessThan(5_000);

      for (let i = 0; i < N; i++) {
        const after = await findEntityById(db, stmts[i].id);
        expect(after.data.territory.order).toBe(1000 + (N - 1 - i));
      }
    },
    30_000
  );
  });
});
