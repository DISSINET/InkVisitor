import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import { createMockTree } from "@modules/common.test";
import User from "@models/user/user";
import Statement, { StatementTerritory } from "@models/statement/statement";
import Resource from "@models/resource/resource";
import Concept from "@models/concept/concept";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import treeCache from "@service/treeCache";
import { IResponseQueryEntity } from "@inkvisitor/shared/types/response-query";

/**
 * The Explorer renders editable cells per row, and every one of them writes to
 * that row's entity. The query response therefore carries the mode each entity
 * resolves to, so the table can offer controls only where a write would be
 * accepted.
 */
describe("entities query - per-row rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-query-${rand}`;
  const writableT = `T1-${rand}`;
  const readOnlyT = `T2-${rand}`;
  let editorAgent: AuthAgent;

  const ids = {
    stmtWritable: `S-write-${rand}`,
    stmtReadOnly: `S-read-${rand}`,
    resourcePlain: `R-plain-${rand}`,
    resourceWithDoc: `R-doc-${rand}`,
    concept: `C-${rand}`,
  };

  beforeAll(async () => {
    await db.initDb();
    await createMockTree(db, rand);

    for (const [id, territoryId] of [
      [ids.stmtWritable, writableT],
      [ids.stmtReadOnly, readOnlyT],
    ] as [string, string][]) {
      const statement = new Statement({ id } as any);
      statement.data.territory = new StatementTerritory({ territoryId });
      await statement.save(db.connection);
    }

    await new Resource({ id: ids.resourcePlain } as any).save(db.connection);
    await new Resource({
      id: ids.resourceWithDoc,
      data: { documentId: `doc-${rand}` },
    } as any).save(db.connection);
    await new Concept({ id: ids.concept } as any).save(db.connection);

    await new User({
      id: editorId,
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
      rights: [
        { territory: writableT, mode: UserEnums.RoleMode.Write },
        { territory: readOnlyT, mode: UserEnums.RoleMode.Read },
      ],
    } as any).save(db.connection);
    editorAgent = await createAgentWithUserId(editorId);

    treeCache.db = db.connection;
    treeCache.tree = await treeCache.createTree();
  });

  afterAll(async () => {
    await rethink.table("users").getAll(editorId).delete().run(db.connection);
    await db.close();
    await pool.end();
  });

  const rightsByEntityId = async (): Promise<Record<string, string>> => {
    const res = await editorAgent
      .post(`${apiPath}/entities/query`)
      .send({
        query: { params: {}, type: "X", operator: "a" },
        explore: { view: { mode: "table", columns: [] }, filters: [], limit: 200, offset: 0 },
      })
      .expect(200);

    const out: Record<string, string> = {};
    (res.body.entities as IResponseQueryEntity[]).forEach((row) => {
      out[row.entity.id] = row.right as string;
    });
    return out;
  };

  it("marks each row with the mode its own class rules produce", async () => {
    const rights = await rightsByEntityId();

    // Territory: only where the editor holds write
    expect(rights[writableT]).toBe(UserEnums.RoleMode.Write);
    expect(rights[readOnlyT]).toBe(UserEnums.RoleMode.Read);

    // Statement: follows the right of the territory it sits in
    expect(rights[ids.stmtWritable]).toBe(UserEnums.RoleMode.Write);
    expect(rights[ids.stmtReadOnly]).toBe(UserEnums.RoleMode.Read);

    // Resource: writable without a document, needs the annotate right with one
    expect(rights[ids.resourcePlain]).toBe(UserEnums.RoleMode.Write);
    expect(rights[ids.resourceWithDoc]).toBe(UserEnums.RoleMode.Read);

    // a class with no scoping of its own stays writable
    expect(rights[ids.concept]).toBe(UserEnums.RoleMode.Write);
  });
});
