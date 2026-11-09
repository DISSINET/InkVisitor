import { Db } from "@service/storage";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import User from "@models/user/user";
import Concept from "@models/concept/concept";
import Superclass from "@models/relation/superclass";
import Classification from "@models/relation/classification";
import { storage } from "@service/storage";
import { UserEnums } from "@inkvisitor/shared/enums";
import { BadParams } from "@inkvisitor/shared/types/errors";
import { CLASSIFIED_UNDER_MAX_CONCEPTS } from "@inkvisitor/shared/types";
import { pool } from "@middlewares/db";
import { testErroneousResponse } from "@modules/common.test";

/**
 * GET /entities/classified-under tells the Geocoding page which entities come
 * under the project's location types. The page is open to every logged-in user,
 * a viewer among them, and the route has no acl_permissions row: it is opened
 * in code, so a viewer reaching it is what keeps the list of types from being
 * empty for everyone but an editor.
 */
describe("entities/classified-under", () => {
  const db = new Db();
  const rand = Math.random().toString();
  const viewerId = `viewer-classified-${rand}`;
  const settlement = new Concept({ id: `settlement-${rand}`, labels: ["settlement"] });
  const city = new Concept({ id: `city-${rand}`, labels: ["city"] });
  const subclass = new Superclass({ id: `scl-${rand}`, entityIds: [city.id, settlement.id] });
  const locationId = `location-${rand}`;
  const classification = new Classification({
    id: `cla-${rand}`,
    entityIds: [locationId, city.id],
  });
  let viewerAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();
    await settlement.save(db.connection);
    await city.save(db.connection);
    await subclass.save(db.connection);
    await classification.save(db.connection);
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
    await storage.users.deleteMany(db.connection, [viewerId]);
    await storage.relations.delete(db.connection, subclass.id);
    await storage.relations.delete(db.connection, classification.id);
    await storage.entities.deleteMany(db.connection, [settlement.id, city.id]);
    await db.close();
    await pool.end();
  });

  it("answers a viewer, with the entity classified under a subclass marked as inferred", async () => {
    const response = await viewerAgent
      .get(`${apiPath}/entities/classified-under?concepts=${settlement.id}`)
      .expect(200);
    expect(response.body).toEqual({
      entities: {
        [locationId]: [
          { concept: settlement.id, via: city.id, inferred: true, shadowed: false },
        ],
      },
      truncated: [],
    });
  });

  it("takes several Concepts, however they are written in the query", async () => {
    const asComma = await viewerAgent
      .get(`${apiPath}/entities/classified-under?concepts=${settlement.id},${city.id}`)
      .expect(200);
    const repeated = await viewerAgent
      .get(
        `${apiPath}/entities/classified-under?concepts=${settlement.id}&concepts=${city.id}`
      )
      .expect(200);
    expect(asComma.body.entities[locationId].map((one: { concept: string }) => one.concept)).toEqual(
      [settlement.id, city.id]
    );
    expect(repeated.body).toEqual(asComma.body);
  });

  it("is not taken for the entity with that id", async () => {
    // declared after `/:entityId` it would answer EntityDoesNotExist
    const response = await viewerAgent.get(`${apiPath}/entities/classified-under`);
    expect(response.status).not.toBe(404);
    expect(response.body.error).toBe("BadParams");
  });

  it("refuses a request that names no Concept", async () => {
    await viewerAgent
      .get(`${apiPath}/entities/classified-under?concepts=`)
      .expect(testErroneousResponse.bind(undefined, new BadParams("")));
  });

  it("refuses a request that names more Concepts than a walk each is worth", async () => {
    const many = Array.from({ length: CLASSIFIED_UNDER_MAX_CONCEPTS + 1 }, (_, i) => `c${i}`);
    await viewerAgent
      .get(`${apiPath}/entities/classified-under?concepts=${many.join(",")}`)
      .expect(testErroneousResponse.bind(undefined, new BadParams("")));
  });
});
