import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import { createMockTree } from "@modules/common.test";
import User from "@models/user/user";
import Statement, { StatementTerritory } from "@models/statement/statement";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import treeCache from "@service/treeCache";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

/**
 * References sit on the statement row, so the batch replace/append behind the
 * statement list is an edit of every statement it names. The ACL row opens the
 * route to the editor role; which statements he may actually touch is decided
 * per statement inside the handler, because the route carries no territory.
 */
describe("statements/references - editor rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-refs-${rand}`;
  const writableT = `T1-${rand}`;
  const readOnlyT = `T2-${rand}`;
  let editorAgent: AuthAgent;

  const reference = { id: `ref-${rand}`, resource: `R-${rand}`, value: "" };

  const statementIn = async (territoryId: string): Promise<Statement> => {
    const statement = new Statement({} as any);
    statement.data.territory = new StatementTerritory({ territoryId });
    await statement.save(db.connection);
    return statement;
  };

  const referencesOf = async (statementId: string): Promise<unknown[]> =>
    ((await rethink.table("entities").get(statementId).run(db.connection)) as any)
      .references ?? [];

  beforeAll(async () => {
    await db.initDb();
    await createMockTree(db, rand);

    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) => row.controller === "statements" && row.route === "references"
    );
    await rethink.table("acl_permissions").insert(seeded).run(db.connection);

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

  it("appends a reference to a statement the editor may write", async () => {
    const statement = await statementIn(writableT);

    await editorAgent
      .put(`${apiPath}/statements/references?ids=${statement.id}`)
      .send([reference])
      .expect(200);

    expect(await referencesOf(statement.id)).toHaveLength(1);
  });

  it("replaces references on a statement the editor may write", async () => {
    const statement = await statementIn(writableT);

    await editorAgent
      .put(`${apiPath}/statements/references?ids=${statement.id}&replace=true`)
      .send([reference])
      .expect(200);

    expect(await referencesOf(statement.id)).toHaveLength(1);
  });

  it("refuses to append to a statement the editor may only read", async () => {
    const statement = await statementIn(readOnlyT);

    const res = await editorAgent
      .put(`${apiPath}/statements/references?ids=${statement.id}`)
      .send([reference]);

    expect(res.status).toBe(403);
    expect(await referencesOf(statement.id)).toHaveLength(0);
  });

  it("refuses the whole batch when one statement is out of reach", async () => {
    const writable = await statementIn(writableT);
    const readOnly = await statementIn(readOnlyT);

    const res = await editorAgent
      .put(`${apiPath}/statements/references?ids=${writable.id},${readOnly.id}`)
      .send([reference]);

    expect(res.status).toBe(403);
    expect(await referencesOf(writable.id)).toHaveLength(0);
  });
});
