import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, BadParams } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import { deleteEntities } from "@service/shorthands";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { pool } from "@middlewares/db";
import Territory from "@models/territory/territory";
import treeCache from "@service/treeCache";

describe("Entities detail", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  // Skipped: Express normalizes the consecutive slashes in `/entities//detail`
  // down to `/entities/detail`, which matches the `/:entityId` base GET route
  // (entityId="detail") rather than `/:entityId/detail` with an empty id. The
  // empty-entityId BadParams branch in the detail handler is therefore no longer
  // reachable from a URL path, so this scenario cannot be reproduced via HTTP.
  describe.skip("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/entities//detail`)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("Wrong param", () => {
    it("should return a EntityDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/entities/123/detail`)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async () => {
      const db = new Db();
      await db.initDb();

      // The detail response builds territory-based warnings for non-template
      // entities and needs a populated tree cache with a single root territory;
      // the cache is not initialized in NODE_ENV=test, so seed it here. Wipe
      // first so leftover territories from other suites can't make createTree()
      // throw TerritoriesBrokenError.
      await deleteEntities(db);
      const rootTerritory = new Territory({ id: `root-${Math.random()}` });
      await rootTerritory.save(db.connection);
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      const statementRandomId = Math.random().toString();
      const entityData = new Statement({
        id: statementRandomId,
        data: new StatementData({
          territory: new StatementTerritory({
            territoryId: rootTerritory.id,
          }),
        }),
      });

      await entityData.save(db.connection);

      await authAgent
        .get(`${apiPath}/entities/${statementRandomId}/detail`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toEqual(statementRandomId);
        });

      await clean(db);
    });
  });
});
