import "ts-jest";
import { apiPath } from "@common/constants";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { BadParams } from "@inkvisitor/shared/types/errors";

// batchAddRelation creates N relations of ONE type in a loop. beforeSave needs
// all relations of that type for its duplicate check, and for asymmetrical
// types a path graph for the cycle check - both of which it would otherwise
// reload per entity (Relation.getByType is an unindexed full table scan). The
// route now builds that once and folds every created relation back in, so
// these tests pin the semantics that sharing must not break.
//
// Superclass is deliberate: non-cloud (so entityIds stay a plain [source,
// target] pair) AND asymmetrical (so the shared Path is exercised too).
const REL_TYPE = RelationEnums.Type.Superclass;

describe("Entities batchAddRelation", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;
  let db: Db;

  const makeConcept = async (): Promise<Entity> => {
    const entity = new Entity({
      id: `test-bar-${Math.random().toString()}`,
      class: EntityEnums.Class.Concept,
    });
    entity.labels = [`${entity.id}-label`];
    await entity.save(db.connection);
    return entity;
  };

  const addRelations = (entityIds: string[], targetEntityId: string) =>
    authAgent
      .post(`${apiPath}/entities/batchAddRelation`)
      .send({ entityIds, relationType: REL_TYPE, targetEntityId });

  /** ids of the entities pointed AT the given target by a relation of REL_TYPE */
  const sourcesLinkedTo = async (targetId: string): Promise<string[]> => {
    const all = await Relation.getByType(db.connection, REL_TYPE);
    return all
      .filter((rel) => rel.entityIds[1] === targetId)
      .map((rel) => rel.entityIds[0])
      .sort();
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

  describe("several entities, one target", () => {
    it("creates a relation for every entity", async () => {
      const target = await makeConcept();
      const sources = [await makeConcept(), await makeConcept(), await makeConcept()];
      const sourceIds = sources.map((e) => e.id);

      const res = await addRelations(sourceIds, target.id);

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(true);
      expect(res.body.message).toContain("3/3");
      expect(await sourcesLinkedTo(target.id)).toEqual([...sourceIds].sort());
    });
  });

  describe("an entity already related to the target", () => {
    it("reports that entity and still creates the others", async () => {
      const target = await makeConcept();
      const alreadyLinked = await makeConcept();
      const fresh = await makeConcept();

      // pre-existing relation - loaded into the shared context up front
      const first = await addRelations([alreadyLinked.id], target.id);
      expect(first.body.result).toBe(true);

      const res = await addRelations([alreadyLinked.id, fresh.id], target.id);

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/2");
      expect(res.body.message).toContain(alreadyLinked.id);
      expect(await sourcesLinkedTo(target.id)).toEqual(
        [alreadyLinked.id, fresh.id].sort()
      );
    });
  });

  describe("the same entity listed twice in one batch", () => {
    it("creates the relation once, the second occurrence is a duplicate", async () => {
      const target = await makeConcept();
      const source = await makeConcept();

      // only correct if a relation created DURING the batch is folded back into
      // the shared context - otherwise this creates two identical relations
      const res = await addRelations([source.id, source.id], target.id);

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/2");
      expect(await sourcesLinkedTo(target.id)).toEqual([source.id]);
    });
  });

  describe("a batch that would reverse an existing superclass", () => {
    it("is rejected by the asymmetrical path check", async () => {
      const a = await makeConcept();
      const b = await makeConcept();

      // a -> b
      const first = await addRelations([a.id], b.id);
      expect(first.body.result).toBe(true);

      // b -> a would close the cycle; the shared Path must still catch it
      const res = await addRelations([b.id], a.id);

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(false);
      expect(await sourcesLinkedTo(a.id)).toEqual([]);
    });
  });

  describe("a relation type outside BatchTypes", () => {
    it("is rejected", async () => {
      const target = await makeConcept();
      const source = await makeConcept();

      // Synonym merges clouds and deletes sibling relations while saving, so a
      // run of saves cannot share one context - it is not a batch type
      const res = await authAgent
        .post(`${apiPath}/entities/batchAddRelation`)
        .send({
          entityIds: [source.id],
          relationType: RelationEnums.Type.Synonym,
          targetEntityId: target.id,
        });

      expect(res.status).toEqual(new BadParams("").statusCode());
      expect(res.body.result).toBe(false);
      expect(res.body.error).toEqual("BadParams");
    });
  });

  describe("no valid entity in the batch", () => {
    it("returns result false without creating anything", async () => {
      const target = await makeConcept();
      const source = await makeConcept();

      const first = await addRelations([source.id], target.id);
      expect(first.body.result).toBe(true);

      const res = await addRelations([source.id], target.id);

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(false);
      expect(await sourcesLinkedTo(target.id)).toEqual([source.id]);
    });
  });
});
