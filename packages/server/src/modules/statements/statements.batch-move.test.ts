import {
  testErroneousResponse,
  successfulGenericResponse,
  createMockTree,
} from "@modules/common.test";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
} from "@inkvisitor/shared/types/errors";
import request from "supertest";
import {
  AuthAgent,
  createAgentWithUserId,
  getAuthenticatedAgent,
} from "@modules/testAuth";
import { apiPath } from "@common/constants";
import { UserEnums } from "@inkvisitor/shared/enums";
import app from "../../server";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import Statement, { StatementTerritory } from "@models/statement/statement";
import User from "@models/user/user";
import treeCache from "@service/treeCache";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";

describe("statements/batch-move", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Empty/Invalid params", () => {
    it("should return a BadParams error wrapped in IResponseGeneric for empty params", async () => {
      await authAgent
        .put(`${apiPath}/statements/batch-move`)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing territory id", async () => {
      await authAgent
        .put(`${apiPath}/statements/batch-move?ids=1,2,3`)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing ids", async () => {
      await authAgent
        .put(`${apiPath}/statements/batch-move`)
        .send({ territoryId: "1" })
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
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();
      rootId = `root-${randSuffix}`;
      T1Id = `T1-${randSuffix}`;
    });

    afterAll(async () => {
      await db.close();
    });

    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric for invalid id", async () => {
      await authAgent
        .put(`${apiPath}/statements/batch-move?ids=1`)
        .send({ territoryId: "random-something" })
        .expect(
          testErroneousResponse.bind(
            undefined,
            new TerritoryDoesNotExits("", "")
          )
        );
    });

    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric for invalid id", async () => {
      await authAgent
        .put(`${apiPath}/statements/batch-move?ids=1`)
        .send({ territoryId: treeCache.tree.parentMap[""][0].id })
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        );
    });

    it("should return a successful IResponseGeneric for valid ids while not changing the territory", async () => {
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

      await authAgent
        .put(
          `${apiPath}/statements/batch-move?ids=${statement1.id},${statement2.id}`
        )
        .send({ territoryId: rootId })
        .expect((resp) => !!resp.body.result);
    });

    it("should return a successful IResponseGeneric for valid ids while changing the territory", async () => {
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

      await authAgent
        .put(
          `${apiPath}/statements/batch-move?ids=${statement1.id},${statement2.id}`
        )
        .send({ territoryId: T1Id })
        .expect((resp) => !!resp.body.result);

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement1.id);
      expect(statement1After.data.territory.territoryId).toEqual(T1Id);
      expect(statement2After.data.territory.territoryId).toEqual(T1Id);
    });
  });

  describe("Editor rights", () => {
    const db = new Db();
    const randSuffix = Math.random().toString();
    let sourceId = "";
    let targetId = "";

    const editorNoTargetId = `test-editor-no-target-${randSuffix}`;
    const editorBothId = `test-editor-both-${randSuffix}`;
    let editorNoTargetAgent: AuthAgent;
    let editorBothAgent: AuthAgent;

    beforeAll(async () => {
      await db.initDb();
      await createMockTree(db, randSuffix);
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();
      sourceId = `T2-1-${randSuffix}`;
      targetId = `T1-2-${randSuffix}`;

      // batch-move has no seeded ACL row, so the ACL layer auto-creates an
      // admin-only (roles: []) one and blocks editors before the handler runs.
      // Open it to all roles - the handler is what enforces territory rights,
      // mirroring entities PUT /:entityId.
      await rethink
        .table("acl_permissions")
        .filter({ controller: "statements", method: "PUT", route: "batch-move" })
        .delete()
        .run(db.connection);
      await rethink
        .table("acl_permissions")
        .insert({
          controller: "statements",
          method: "PUT",
          route: "batch-move",
          roles: ["*"],
          public: false,
        })
        .run(db.connection);

      await new User({
        id: editorNoTargetId,
        role: UserEnums.Role.Editor,
        active: true,
        verified: true,
        rights: [{ territory: sourceId, mode: UserEnums.RoleMode.Write }],
      } as any).save(db.connection);
      await new User({
        id: editorBothId,
        role: UserEnums.Role.Editor,
        active: true,
        verified: true,
        rights: [
          { territory: sourceId, mode: UserEnums.RoleMode.Write },
          { territory: targetId, mode: UserEnums.RoleMode.Write },
        ],
      } as any).save(db.connection);

      editorNoTargetAgent = await createAgentWithUserId(editorNoTargetId);
      editorBothAgent = await createAgentWithUserId(editorBothId);
    });

    afterAll(async () => {
      await rethink
        .table("users")
        .getAll(editorNoTargetId, editorBothId)
        .delete()
        .run(db.connection);
      await db.close();
    });

    const createStatementInSource = async (): Promise<Statement> => {
      const statement = new Statement({});
      statement.data.territory = new StatementTerritory({
        territoryId: sourceId,
      });
      await statement.save(db.connection);
      return statement;
    };

    it("editor lacking rights on target territory is denied", async () => {
      const statement = await createStatementInSource();

      await editorNoTargetAgent
        .put(`${apiPath}/statements/batch-move?ids=${statement.id}`)
        .send({ territoryId: targetId })
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
    });

    it("editor with rights on both source and target succeeds", async () => {
      const statement = await createStatementInSource();

      const res = await editorBothAgent
        .put(`${apiPath}/statements/batch-move?ids=${statement.id}`)
        .send({ territoryId: targetId })
        .expect(200);
      expect(res.body.result).toEqual(true);
    });
  });
});
