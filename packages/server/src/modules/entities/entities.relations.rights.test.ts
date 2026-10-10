import { Db } from "@service/rethink";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import User from "@models/user/user";
import Concept from "@models/concept/concept";
import Superclass from "@models/relation/superclass";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { r as rethink } from "rethinkdb-ts";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

/**
 * GET /entities/:entityId/relations is read by the Explorer relation column and
 * by the JSON import's checks, both of which an Editor uses. A route without
 * an acl_permissions row answers only to Admin/Owner.
 */
describe("entities/:entityId/relations - rights", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const editorId = `editor-relations-${rand}`;
  const viewerId = `viewer-relations-${rand}`;
  const dog = new Concept({ id: `dog-${rand}`, labels: ["dog"] });
  const animal = new Concept({ id: `animal-${rand}`, labels: ["animal"] });
  const superclass = new Superclass({
    id: `scl-${rand}`,
    entityIds: [dog.id, animal.id],
  });
  let editorAgent: AuthAgent;
  let viewerAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();

    const seeded = (defaultAcl as Array<Record<string, unknown>>).filter(
      (row) => row.controller === "entities" && row.route === ":entityId/relations"
    );
    await rethink.table("acl_permissions").insert(seeded).run(db.connection);

    await dog.save(db.connection);
    await animal.save(db.connection);
    await superclass.save(db.connection);

    for (const [id, role] of [
      [editorId, UserEnums.Role.Editor],
      [viewerId, UserEnums.Role.Viewer],
    ] as const) {
      await new User({ id, role, active: true, verified: true, rights: [] } as any).save(
        db.connection
      );
    }
    editorAgent = await createAgentWithUserId(editorId);
    viewerAgent = await createAgentWithUserId(viewerId);
  });

  afterAll(async () => {
    await rethink.table("users").getAll(editorId, viewerId).delete().run(db.connection);
    await rethink.table("relations").get(superclass.id).delete().run(db.connection);
    await rethink.table("entities").getAll(dog.id, animal.id).delete().run(db.connection);
    await db.close();
    await pool.end();
  });

  it("lets an editor read the relations of an entity", async () => {
    const response = await editorAgent
      .get(`${apiPath}/entities/${dog.id}/relations?filters%5BrelationType%5D=SCL&forward=true`)
      .expect(200);
    expect(response.body.map((relation: { id: string }) => relation.id)).toEqual([
      superclass.id,
    ]);
  });

  it("does not let a viewer read them", async () => {
    const response = await viewerAgent.get(`${apiPath}/entities/${dog.id}/relations`);
    expect(response.status).not.toBe(200);
  });
});
