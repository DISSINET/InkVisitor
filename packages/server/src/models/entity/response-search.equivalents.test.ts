import "ts-jest";
import { Db } from "@service/rethink";
import { deleteEntities, deleteRelations } from "@service/shorthands";
import { getRelationClass } from "@models/factory";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { RequestSearch } from "@inkvisitor/shared/types/request-search";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import Entity from "./entity";
import { ResponseSearch } from "./response-search";

/**
 * Verifies #2969 ResponseSearch.expandResults: mixes equivalents/subordinates
 * into the results, but only when they satisfy the other (non-label) conditions
 * of the request - exercised here via the equivalents path with a class filter.
 *
 * Kept in a standalone file (not response-search.test.ts) to avoid the
 * pre-existing broken `entity.test` import there.
 */
describe("ResponseSearch.expandResults", () => {
  const db = new Db();

  // c1 (base) is synonym-clouded with c2 (Concept) and a1 (Action). Only c2 is a
  // Concept, so a class=Concept request must drop a1 from the equivalents.
  const c1 = new Entity({ id: "rs-eq-c1", class: EntityEnums.Class.Concept });
  const c2 = new Entity({ id: "rs-eq-c2", class: EntityEnums.Class.Concept });
  const a1 = new Entity({ id: "rs-eq-a1", class: EntityEnums.Class.Action });

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);
    await deleteEntities(db);

    for (const e of [c1, c2, a1]) {
      e.labels = [`${e.id}-label`];
      await e.save(db.connection);
    }

    const cloud = getRelationClass({
      id: "rs-eq-syn-cloud",
      type: RelationEnums.Type.Synonym,
      entityIds: [c1.id, c2.id, a1.id],
    } as RelationTypes.IRelation);
    await cloud.save(db.connection);
  }, 60000);

  afterAll(async () => {
    await deleteRelations(db);
    await deleteEntities(db);
    await db.close();
  }, 60000);

  test("mixes equivalents in and flags them when no other condition constrains them", async () => {
    const { entities, equivalentIds } = await ResponseSearch.expandResults(
      db.connection,
      new RequestSearch({ includeEquivalents: true }),
      [c1]
    );
    expect(entities.map((e) => e.id).sort()).toEqual([
      "rs-eq-a1",
      "rs-eq-c1",
      "rs-eq-c2",
    ]);
    // the added entities (not the base c1) are flagged as equivalents
    expect([...equivalentIds].sort()).toEqual(["rs-eq-a1", "rs-eq-c2"]);
  });

  test("drops equivalents that fail the class condition", async () => {
    const { entities } = await ResponseSearch.expandResults(
      db.connection,
      new RequestSearch({ class: EntityEnums.Class.Concept, includeEquivalents: true }),
      [c1]
    );
    // a1 (Action) must be excluded; c2 (Concept) kept
    expect(entities.map((e) => e.id).sort()).toEqual(["rs-eq-c1", "rs-eq-c2"]);
  });

  test("keeps base entities and dedups", async () => {
    const { entities } = await ResponseSearch.expandResults(
      db.connection,
      new RequestSearch({ includeEquivalents: true }),
      [c1, c2]
    );
    // c2 already in base must not be duplicated; a1 added
    expect(entities.length).toBe(3);
    expect(entities.map((e) => e.id).sort()).toEqual([
      "rs-eq-a1",
      "rs-eq-c1",
      "rs-eq-c2",
    ]);
  });

  test("no expansion flags when neither option is enabled", async () => {
    const { entities, equivalentIds, subordinateIds } =
      await ResponseSearch.expandResults(
        db.connection,
        new RequestSearch({}),
        [c1]
      );
    expect(entities.map((e) => e.id)).toEqual(["rs-eq-c1"]);
    expect(equivalentIds.size).toBe(0);
    expect(subordinateIds.size).toBe(0);
  });
});
