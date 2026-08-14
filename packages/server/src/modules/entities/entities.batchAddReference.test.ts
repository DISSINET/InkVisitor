import "ts-jest";
import { apiPath } from "@common/constants";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { findEntityById } from "@service/shorthands";

// A V is an endpoint: the value added to one entity of a batch is not the value
// added to the next. The route therefore takes a label and mints a V per entity
// instead of taking one id that every entity would share.
describe("Entities batchAddReference", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;
  let db: Db;

  const makeEntity = async (entityClass: EntityEnums.Class): Promise<Entity> => {
    const entity = new Entity({
      id: `test-bar-${Math.random().toString()}`,
      class: entityClass,
    });
    entity.labels = [`${entity.id}-label`];
    await entity.save(db.connection);
    return entity;
  };

  const addReference = (
    entityIds: string[],
    resourceEntityId: string,
    valueLabel?: string
  ) =>
    authAgent
      .post(`${apiPath}/entities/batchAddReference`)
      .send({ entityIds, resourceEntityId, valueLabel });

  /** the reference values stored on the given entities, in the same order */
  const valueIdsOf = async (entityIds: string[]): Promise<string[]> => {
    const values: string[] = [];
    for (const entityId of entityIds) {
      const entity = await findEntityById(db, entityId);
      values.push(entity.references[0]?.value ?? "");
    }
    return values;
  };

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("a labelled value", () => {
    it("gives every entity a V of its own", async () => {
      const resource = await makeEntity(EntityEnums.Class.Resource);
      const targets = [
        await makeEntity(EntityEnums.Class.Concept),
        await makeEntity(EntityEnums.Class.Concept),
        await makeEntity(EntityEnums.Class.Concept),
      ];
      const targetIds = targets.map((e) => e.id);

      const res = await addReference(targetIds, resource.id, "f. 12r");

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(true);
      expect(res.body.message).toContain("3/3");

      const valueIds = await valueIdsOf(targetIds);
      expect(valueIds.filter((id) => !!id).length).toEqual(3);
      expect(new Set(valueIds).size).toEqual(3);

      for (const valueId of valueIds) {
        const value = await findEntityById(db, valueId);
        expect(value.class).toEqual(EntityEnums.Class.Value);
        expect(value.labels).toEqual(["f. 12r"]);
        expect(value.status).toEqual(EntityEnums.Status.Approved);
        expect(value.detail).toEqual("");
        expect(value.props).toEqual([]);
        expect(value.references).toEqual([]);
      }
    });
  });

  describe("no value label", () => {
    it("adds the reference with an empty value and creates nothing", async () => {
      const resource = await makeEntity(EntityEnums.Class.Resource);
      const target = await makeEntity(EntityEnums.Class.Concept);

      const res = await addReference([target.id], resource.id);

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(true);

      const stored = await findEntityById(db, target.id);
      expect(stored.references.length).toEqual(1);
      expect(stored.references[0].resource).toEqual(resource.id);
      expect(stored.references[0].value).toEqual("");
    });
  });
});
