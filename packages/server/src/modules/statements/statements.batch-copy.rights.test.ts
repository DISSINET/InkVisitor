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
 * Duplicating statements writes the copies into the target Territory, so that is
 * what has to be writable. The sources are only read - seeing a statement is
 * enough to take a copy of it somewhere the user may write.
 *
 * Duplicating in place takes a different route: the client loops
 * POST /entities/:id/clone per statement when no target is given, which lands on
 * Statement.canBeCreatedByUser instead.
 */
describe("statements/batch-copy - editor rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-copy-${rand}`;
  const writableT = `T1-${rand}`;
  const readOnlyT = `T2-${rand}`;
  let editorAgent: AuthAgent;

  const statementIn = async (territoryId: string): Promise<Statement> => {
    const statement = new Statement({} as any);
    statement.data.territory = new StatementTerritory({ territoryId });
    await statement.save(db.connection);
    return statement;
  };

  beforeAll(async () => {
    await db.initDb();
    await createMockTree(db, rand);

    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) =>
        (row.controller === "statements" && row.route === "batch-copy") ||
        (row.controller === "entities" && row.route === ":entityId/clone")
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

  const countIn = async (territoryId: string): Promise<number> =>
    (await Statement.findStatementsInTerritory(db.connection, territoryId)).length;

  it("copies into a territory the editor may write", async () => {
    const source = await statementIn(writableT);
    const before = await countIn(writableT);

    await editorAgent
      .post(`${apiPath}/statements/batch-copy?ids=${source.id}`)
      .send({ territoryId: writableT })
      .expect(200);

    expect(await countIn(writableT)).toBe(before + 1);
  });

  it("copies out of a read-only territory into a writable one", async () => {
    const source = await statementIn(readOnlyT);
    const before = await countIn(writableT);

    await editorAgent
      .post(`${apiPath}/statements/batch-copy?ids=${source.id}`)
      .send({ territoryId: writableT })
      .expect(200);

    expect(await countIn(writableT)).toBe(before + 1);
  });

  it("refuses to copy into a territory the editor may only read", async () => {
    const source = await statementIn(writableT);
    const before = await countIn(readOnlyT);

    const res = await editorAgent
      .post(`${apiPath}/statements/batch-copy?ids=${source.id}`)
      .send({ territoryId: readOnlyT });

    expect(res.status).toBe(403);
    expect(await countIn(readOnlyT)).toBe(before);
  });

  it("refuses a clone that would duplicate in place inside a read-only territory", async () => {
    const source = await statementIn(readOnlyT);
    const before = await countIn(readOnlyT);

    const res = await editorAgent.post(
      `${apiPath}/entities/${source.id}/clone`
    );

    expect(res.status).toBe(403);
    expect(await countIn(readOnlyT)).toBe(before);
  });
});
