import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import Concept from "@models/concept/concept";
import Territory from "@models/territory/territory";
import User from "@models/user/user";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import { findEntityById } from "@service/shorthands";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

/**
 * The delete route is declared as "/:entityId?" - the optional param lets one
 * call carry a single id in the URL and a batch in the body. AclPermission
 * lookup keys on that literal path, so a row seeded under ":entityId" is never
 * matched: the ACL layer finds nothing, persists a roles:[] row of its own and
 * denies every non-Admin. Seeding straight from the shipped dataset is what
 * makes this a regression test - a drifted key fails here rather than in the UI.
 */
describe("entities delete - editor rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-del-${rand}`;
  const viewerId = `viewer-del-${rand}`;
  let editorAgent: AuthAgent;
  let viewerAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();

    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) =>
        row.controller === "entities" &&
        (row.method === "DELETE" || row.route === ":entityId/restore")
    );
    await rethink
      .table("acl_permissions")
      .filter((row: any) =>
        row("controller")
          .eq("entities")
          .and(
            row("method").eq("DELETE").or(row("route").eq(":entityId/restore"))
          )
      )
      .delete()
      .run(db.connection);
    await rethink.table("acl_permissions").insert(seeded).run(db.connection);

    await new User({
      id: editorId,
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
      rights: [],
    } as any).save(db.connection);
    editorAgent = await createAgentWithUserId(editorId);

    await new User({
      id: viewerId,
      role: UserEnums.Role.Viewer,
      active: true,
      verified: true,
      rights: [],
    } as any).save(db.connection);
    viewerAgent = await createAgentWithUserId(viewerId);
  });

  afterAll(async () => {
    await rethink
      .table("users")
      .getAll(editorId, viewerId)
      .delete()
      .run(db.connection);
    await db.close();
    await pool.end();
  });

  it("editor may delete a template entity", async () => {
    const template = new Concept({ id: `C-tmpl-${rand}` });
    template.isTemplate = true;
    await template.save(db.connection);

    await editorAgent.delete(`${apiPath}/entities/${template.id}`).expect(200);

    expect(await findEntityById(db, template.id)).toBeFalsy();
  });

  it("editor may delete a plain entity", async () => {
    const concept = new Concept({ id: `C-plain-${rand}` });
    await concept.save(db.connection);

    await editorAgent.delete(`${apiPath}/entities/${concept.id}`).expect(200);

    expect(await findEntityById(db, concept.id)).toBeFalsy();
  });

  it("editor may restore a template territory they deleted", async () => {
    // the delete toast offers a Restore link, so the pair has to be reachable
    // by whoever was allowed to delete in the first place
    const template = new Territory({ id: `T-tmpl-${Math.random()}` } as any);
    template.isTemplate = true;
    await template.save(db.connection);

    // the delete route writes the deletion audit that restore reads back
    await editorAgent.delete(`${apiPath}/entities/${template.id}`).expect(200);
    expect(await findEntityById(db, template.id)).toBeFalsy();

    await editorAgent
      .post(`${apiPath}/entities/${template.id}/restore`)
      .expect(200);
    expect(await findEntityById(db, template.id)).toBeTruthy();
  });

  it("viewer may not delete a template entity", async () => {
    const template = new Concept({ id: `C-tmpl-viewer-${Math.random()}` });
    template.isTemplate = true;
    await template.save(db.connection);

    const res = await viewerAgent.delete(`${apiPath}/entities/${template.id}`);

    expect(res.status).toBe(403);
    expect(await findEntityById(db, template.id)).toBeTruthy();
  });

  it("editor is still refused a territory they hold no right to", async () => {
    // ids are minted per attempt - the suite's retry wrapper re-runs a failed
    // test against rows the first attempt already wrote
    const root = new Territory({ id: `root-${Math.random()}` });
    await root.save(db.connection);
    const territory = new Territory({
      id: `T-nope-${Math.random()}`,
      data: { parent: { territoryId: root.id, order: -1 } },
    } as any);
    await territory.save(db.connection);

    const res = await editorAgent.delete(`${apiPath}/entities/${territory.id}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("PermissionDeniedError");
    expect(await findEntityById(db, territory.id)).toBeTruthy();
  });
});
