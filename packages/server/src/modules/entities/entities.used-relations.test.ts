import { testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist } from "@inkvisitor/shared/types/errors";
import { AuthAgent, createAgentWithUserId, getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import { Db, storage } from "@service/storage";
import { pool } from "@middlewares/db";
import User from "@models/user/user";
import Concept from "@models/concept/concept";
import Superclass from "@models/relation/superclass";
import { RelationEnums, UserEnums } from "@inkvisitor/shared/enums";

describe("entities/:entityId/used-relations", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const viewerId = `viewer-used-relations-${rand}`;
  // dog --SCL--> animal
  const dog = new Concept({ id: `dog-${rand}`, labels: ["dog"] });
  const animal = new Concept({ id: `animal-${rand}`, labels: ["animal"] });
  const superclass = new Superclass({
    id: `scl-${rand}`,
    entityIds: [dog.id, animal.id],
  });
  let adminAgent: AuthAgent;
  let viewerAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();
    await dog.save(db.connection);
    await animal.save(db.connection);
    await superclass.save(db.connection);

    // no acl_permissions row is seeded: the route is open to every logged-in user
    await new User({
      id: viewerId,
      role: UserEnums.Role.Viewer,
      active: true,
      verified: true,
      rights: [],
    } as any).save(db.connection);

    adminAgent = await getAuthenticatedAgent();
    viewerAgent = await createAgentWithUserId(viewerId);
  });

  afterAll(async () => {
    await storage.users.deleteMany(db.connection, [viewerId]);
    await storage.relations.delete(db.connection, superclass.id);
    await storage.entities.deleteMany(db.connection, [dog.id, animal.id]);
    await db.close();
    await pool.end();
  });

  it("returns EntityDoesNotExist for an unknown entity", async () => {
    await adminAgent
      .get(`${apiPath}/entities/123/used-relations`)
      .expect(testErroneousResponse.bind(undefined, new EntityDoesNotExist("", "")));
  });

  it("returns the relations and the entities they point to", async () => {
    await adminAgent
      .get(`${apiPath}/entities/${dog.id}/used-relations`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toEqual(dog.id);
        const connections = res.body.relations[RelationEnums.Type.Superclass].connections;
        expect(connections.map((c: { id: string }) => c.id)).toEqual([superclass.id]);
        expect(res.body.entities[animal.id].labels).toEqual(["animal"]);
        expect(res.body.usedInStatements).toBeUndefined();
      });
  });

  it("returns the inverse side for the relation target", async () => {
    await adminAgent
      .get(`${apiPath}/entities/${animal.id}/used-relations`)
      .expect(200)
      .expect((res) => {
        const iConnections = res.body.relations[RelationEnums.Type.Superclass].iConnections;
        expect(iConnections.map((c: { id: string }) => c.id)).toEqual([superclass.id]);
        expect(res.body.entities[dog.id].labels).toEqual(["dog"]);
      });
  });

  it("answers a viewer", async () => {
    await viewerAgent
      .get(`${apiPath}/entities/${dog.id}/used-relations`)
      .expect(200)
      .expect((res) => expect(res.body.id).toEqual(dog.id));
  });
});
