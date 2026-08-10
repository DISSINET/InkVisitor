import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import { createMockTree } from "@modules/common.test";
import User from "@models/user/user";
import Statement, { StatementTerritory } from "@models/statement/statement";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import { findEntityById } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { IStatement } from "@inkvisitor/shared/types";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

/**
 * Reordering rewrites each statement's position inside its territory, so every
 * statement named in the payload has to be editable. The route accepts ids from
 * more than one territory, so a mixed batch is refused whole - the write is a
 * single bulk query and has no per-row result to report.
 */
describe("statements/batch-reorder - editor rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-reorder-${rand}`;
  const writableT = `T1-${rand}`;
  const readOnlyT = `T2-${rand}`;
  let editorAgent: AuthAgent;

  const statementIn = async (
    territoryId: string,
    order: number
  ): Promise<Statement> => {
    const statement = new Statement({} as any);
    statement.data.territory = new StatementTerritory({ territoryId, order });
    await statement.save(db.connection);
    return statement;
  };

  const orderOf = async (id: string): Promise<number | undefined> => {
    const stored = await findEntityById<IStatement>(db, id);
    return stored?.data.territory?.order;
  };

  beforeAll(async () => {
    await db.initDb();
    await createMockTree(db, rand);

    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) => row.controller === "statements" && row.route === "batch-reorder"
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

  it("reorders statements in a territory the editor may write", async () => {
    const first = await statementIn(writableT, 1);
    const second = await statementIn(writableT, 2);

    await editorAgent
      .put(`${apiPath}/statements/batch-reorder`)
      .send({
        updates: [
          { id: first.id, order: 2 },
          { id: second.id, order: 1 },
        ],
      })
      .expect(200);

    expect(await orderOf(first.id)).toBe(2);
    expect(await orderOf(second.id)).toBe(1);
  });

  it("refuses to reorder statements in a read-only territory", async () => {
    const first = await statementIn(readOnlyT, 1);
    const second = await statementIn(readOnlyT, 2);
    // save assigns the order within the territory, so read back what it chose
    const firstOrder = await orderOf(first.id);
    const secondOrder = await orderOf(second.id);

    const res = await editorAgent
      .put(`${apiPath}/statements/batch-reorder`)
      .send({
        updates: [
          { id: first.id, order: 2 },
          { id: second.id, order: 1 },
        ],
      });

    expect(res.status).toBe(403);
    expect(await orderOf(first.id)).toBe(firstOrder);
    expect(await orderOf(second.id)).toBe(secondOrder);
  });

  it("refuses the whole batch when one statement is out of reach", async () => {
    const allowed = await statementIn(writableT, 1);
    const refused = await statementIn(readOnlyT, 1);
    const allowedOrder = await orderOf(allowed.id);

    const res = await editorAgent
      .put(`${apiPath}/statements/batch-reorder`)
      .send({
        updates: [
          { id: allowed.id, order: 9 },
          { id: refused.id, order: 9 },
        ],
      });

    expect(res.status).toBe(403);
    // the editable one is left alone too - nothing is written
    expect(await orderOf(allowed.id)).toBe(allowedOrder);
  });
});
