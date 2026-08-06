import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import { createMockTree } from "@modules/common.test";
import User from "@models/user/user";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import { findEntityById } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { ITerritory } from "@inkvisitor/shared/types";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

/**
 * Re-parenting a Territory through PUT /entities/:entityId is the same move the
 * tree position route performs. canBeEditedByUser answers for the moved
 * Territory only, so without a second check on the destination an editor could
 * drop a branch they own into one they may only read.
 */
describe("entities update - moving a territory", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-move-${rand}`;
  // T1 is writable, T2 read-only; T1-1-1 sits inside T1 and is the one moved
  const writableId = `T1-1-${rand}`;
  const readOnlyId = `T2-${rand}`;
  const movedId = `T1-1-1-${rand}`;
  let editorAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();
    await createMockTree(db, rand);

    // the table starts empty here, and a route with no row is auto-denied to
    // every non-Admin - seed the update route so the test exercises the
    // handler's own checks rather than the ACL layer
    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) => row.controller === "entities" && row.method === "PUT"
    );
    await rethink
      .table("acl_permissions")
      .filter({ controller: "entities", method: "PUT" })
      .delete()
      .run(db.connection);
    await rethink.table("acl_permissions").insert(seeded).run(db.connection);

    await new User({
      id: editorId,
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
      rights: [
        { territory: `T1-${rand}`, mode: UserEnums.RoleMode.Write },
        { territory: readOnlyId, mode: UserEnums.RoleMode.Read },
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

  const moveUnder = (parentId: string) =>
    editorAgent
      .put(`${apiPath}/entities/${movedId}`)
      .send({ data: { parent: { territoryId: parentId, order: 1 } } });

  const parentOf = async (id: string) => {
    const stored = await findEntityById<ITerritory>(db, id);
    return stored?.data.parent ? stored.data.parent.territoryId : undefined;
  };

  it("refuses a move into a territory the editor may only read", async () => {
    const res = await moveUnder(readOnlyId);

    expect(res.status).toBe(403);
    expect(await parentOf(movedId)).toBe(writableId);
  });

  it("allows a move within the branch the editor may write", async () => {
    await moveUnder(`T1-2-${rand}`).expect(200);

    expect(await parentOf(movedId)).toBe(`T1-2-${rand}`);
  });
});
