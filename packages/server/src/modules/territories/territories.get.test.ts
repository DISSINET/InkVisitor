import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, TerritoryDoesNotExits } from "@inkvisitor/shared/types/errors";
import { Db } from "@service/rethink";
import { createEntity, deleteEntities } from "@service/shorthands";
import Territory from "@models/territory/territory";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import Statement, { StatementData } from "@models/statement/statement";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { pool } from "@middlewares/db";
import treeCache from "@service/treeCache";

describe("Territories get query", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Empty param", () => {
    // The territories GET route is now "/:territoryId" with a required path
    // param, so a request without an id matches no route and yields a 404
    // instead of reaching the BadParams check inside the handler.
    it("should return a 404 for a missing territoryId path segment", async () => {
      await authAgent.get(`${apiPath}/territories`).expect(404);
    });
  });
  describe("Wrong param", () => {
    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/territories/123`)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new TerritoryDoesNotExits("", "")
          )
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTerritory response", async () => {
      const db = new Db();
      await db.initDb();
      await deleteEntities(db);
      // Territory.save() now requires a parent unless the id starts with
      // "root"/"T0" or it is a template - use a root-prefixed id.
      const testTerritoryId = `root-${Math.random()}`;
      const linkedStatementId = Math.random().toString();

      const territory: Territory = new Territory({
        id: testTerritoryId,
      });
      await createEntity(db, territory);

      const statement1 = new Statement({
        id: linkedStatementId,
        data: new StatementData({
          territory: {
            territoryId: "some random",
            order: 1,
          },
        }),
      });
      await createEntity(db, statement1);

      const statement2 = new Statement({
        data: new StatementData({
          tags: [statement1.id],
          territory: {
            territoryId: testTerritoryId,
            order: 2,
          },
        }),
      });
      await createEntity(db, statement2);

      // ResponseTerritory.prepare reads from treeCache (idMap[id].path), which
      // is empty under NODE_ENV=test since initialize() is a no-op. Build the
      // singleton cache from the db explicitly.
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      await authAgent
        .get(`${apiPath}/territories/${testTerritoryId}?preload=1`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeTruthy();
          expect(typeof res.body).toEqual("object");
          // ResponseTerritory now exposes "statements", a preloaded "entities"
          // map (object keyed by id, replacing the old "actants" array) and a
          // "right" field.
          expect(Object.keys(res.body).sort()).toEqual(
            [
              ...Object.keys(territory),
              "statements",
              "entities",
              "right",
            ].sort()
          );

          expect(res.body.statements).toHaveLength(1);
          // statement2 (in this territory) tags statement1, so its referenced
          // entities are preloaded into the entities map.
          expect(res.body.entities[statement1.id]).toBeTruthy();
          expect(res.body.id).toEqual(testTerritoryId);
        });

      await clean(db);
    });
  });
});
