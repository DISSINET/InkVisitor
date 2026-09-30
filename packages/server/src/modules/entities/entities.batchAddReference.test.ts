import "ts-jest";
import { apiPath } from "@common/constants";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { findEntityById } from "@service/shorthands";
import Audit from "@models/audit/audit";
import { RDatum, r } from "rethinkdb-ts";

// A V is an endpoint: the value added to one entity of a batch is not the value
// added to the next. The route therefore takes a label and mints a V per entity
// instead of taking one id that every entity would share.
describe("Entities batchAddReference", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;
  let db: Db;

  const makeEntity = async (
    entityClass: EntityEnums.Class,
    fields: Partial<IEntity> = {}
  ): Promise<Entity> => {
    const entity = new Entity({
      id: `test-bar-${Math.random().toString()}`,
      class: entityClass,
      ...fields,
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

  describe("a selection larger than one write chunk", () => {
    it("gives every entity its reference and V, and audits each write", async () => {
      const resource = await makeEntity(EntityEnums.Class.Resource);
      const count = Entity.UPDATE_MANY_CHUNK + 200;
      const run = Math.random().toString();
      const entities = Array.from({ length: count }, (_, i) => {
        const entity = new Entity({
          id: `test-bar-bulk-${run}-${i}`,
          class: EntityEnums.Class.Concept,
        });
        entity.labels = [`${entity.id}-label`];
        return { ...entity };
      });
      await r.table(Entity.table).insert(entities).run(db.connection);
      const ids = entities.map((entity) => entity.id);

      const res = await addReference(ids, resource.id, "fol. 3v");

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain(`${count}/${count}`);
      const valueIds: string[] = await r
        .table(Entity.table)
        .getAll(r.args(ids))
        .map((entity: RDatum) => entity("references")(0)("value"))
        .run(db.connection);
      expect(new Set(valueIds).size).toEqual(count);
      const values: number = await r
        .table(Entity.table)
        .getAll(r.args(valueIds))
        .filter({ class: EntityEnums.Class.Value })
        .count()
        .run(db.connection);
      expect(values).toEqual(count);
      const audited: number = await r
        .table(Audit.table)
        .filter((audit: RDatum) => r.expr([...ids, ...valueIds]).contains(audit("modelId")))
        .count()
        .run(db.connection);
      expect(audited).toEqual(2 * count);
    });
  });

  describe("a template resource", () => {
    it("is refused per entity, writing nothing and minting no V", async () => {
      const template = await makeEntity(EntityEnums.Class.Resource, { isTemplate: true });
      const target = await makeEntity(EntityEnums.Class.Concept);

      const res = await addReference([target.id], template.id, "f. 1r");

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(false);
      expect(res.body.message).toContain("cannot use template in entity instance");
      expect((await findEntityById(db, target.id)).references).toEqual([]);
      const minted: number = await r
        .table(Entity.table)
        .filter({ class: EntityEnums.Class.Value, labels: ["f. 1r"] })
        .count()
        .run(db.connection);
      expect(minted).toEqual(0);
    });
  });

  describe("a template sent as the value of a labelled batch", () => {
    it("is not used, so it blocks nothing", async () => {
      const resource = await makeEntity(EntityEnums.Class.Resource);
      const templateValue = await makeEntity(EntityEnums.Class.Value, { isTemplate: true });
      const target = await makeEntity(EntityEnums.Class.Concept);

      const res = await authAgent
        .post(`${apiPath}/entities/batchAddReference`)
        .send({
          entityIds: [target.id],
          resourceEntityId: resource.id,
          valueEntityId: templateValue.id,
          valueLabel: "f. 2v",
        });

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/1");
      const [valueId] = await valueIdsOf([target.id]);
      expect(valueId).not.toEqual(templateValue.id);
      expect((await findEntityById(db, valueId)).labels).toEqual(["f. 2v"]);
    });
  });

  describe("an entity that already links a template", () => {
    it("still gets the reference", async () => {
      const template = await makeEntity(EntityEnums.Class.Resource, { isTemplate: true });
      const resource = await makeEntity(EntityEnums.Class.Resource);
      const target = await makeEntity(EntityEnums.Class.Concept, {
        references: [{ id: "old", resource: template.id, value: "" }],
      });

      const res = await addReference([target.id], resource.id);

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/1");
      const stored = await findEntityById(db, target.id);
      expect(stored.references.map((ref) => ref.resource)).toEqual([template.id, resource.id]);
    });
  });
});
