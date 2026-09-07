import "ts-jest";
import { apiPath } from "@common/constants";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { BadParams } from "@inkvisitor/shared/types/errors";

// batchSetAttribute rewrites one attribute across a selection, but only where
// the attribute applies (pos lives on C and A alone) and only where the current
// value is the one named as the source. Everything else must come back
// untouched, which is what these tests pin.

describe("Entities batchSetAttribute", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;
  let db: Db;

  const makeEntity = async (
    entityClass: EntityEnums.Class,
    fields: Partial<IEntity> = {}
  ): Promise<Entity> => {
    const entity = new Entity({
      id: `test-bsa-${Math.random().toString()}`,
      class: entityClass,
      ...fields,
    });
    entity.labels = [`${entity.id}-label`];
    await entity.save(db.connection);
    return entity;
  };

  const setAttribute = (entityIds: string[], changes: unknown) =>
    authAgent.post(`${apiPath}/entities/batchSetAttribute`).send({ entityIds, changes });

  const reload = async (id: string): Promise<IEntity> => {
    const [entity] = await Entity.findEntitiesByIds(db.connection, [id]);
    return entity;
  };

  // A drops an empty pos on save, so the missing value reads back as undefined
  // - the route normalizes it the same way
  const posOf = async (id: string): Promise<string> =>
    ((await reload(id)).data as { pos?: string })?.pos || "";

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("language, from the missing value", () => {
    it("writes only the entities that had no language", async () => {
      const missing = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.Empty,
      });
      const alreadySet = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.Latin,
      });

      const res = await setAttribute([missing.id, alreadySet.id], {
        attribute: "language",
        from: EntityEnums.Language.Empty,
        to: EntityEnums.Language.OldOccitan,
      });

      expect(res.status).toEqual(200);
      expect(res.body.result).toBe(true);
      expect(res.body.message).toContain("1/2");
      expect((await reload(missing.id)).language).toEqual(EntityEnums.Language.OldOccitan);
      expect((await reload(alreadySet.id)).language).toEqual(EntityEnums.Language.Latin);
    });
  });

  describe("language, from one value to another", () => {
    it("leaves entities of other languages untouched", async () => {
      const occitan = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.Occitan,
      });
      const french = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.French,
      });

      const res = await setAttribute([occitan.id, french.id], {
        attribute: "language",
        from: EntityEnums.Language.Occitan,
        to: EntityEnums.Language.OldOccitan,
      });

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/2");
      expect((await reload(occitan.id)).language).toEqual(EntityEnums.Language.OldOccitan);
      expect((await reload(french.id)).language).toEqual(EntityEnums.Language.French);
    });
  });

  describe("language, from any value", () => {
    it("writes every entity whose language differs from the target", async () => {
      const latin = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.Latin,
      });
      const french = await makeEntity(EntityEnums.Class.Concept, {
        language: EntityEnums.Language.French,
      });

      const res = await setAttribute([latin.id, french.id], {
        attribute: "language",
        from: null,
        to: EntityEnums.Language.English,
      });

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("2/2");
      expect((await reload(latin.id)).language).toEqual(EntityEnums.Language.English);
      expect((await reload(french.id)).language).toEqual(EntityEnums.Language.English);
    });
  });

  describe("part of speech on a mixed selection", () => {
    it("writes Concept and Action entities and skips the rest", async () => {
      const concept = await makeEntity(EntityEnums.Class.Concept, {
        data: { pos: EntityEnums.ConceptPartOfSpeech.Empty },
      });
      const action = await makeEntity(EntityEnums.Class.Action, {
        data: { pos: "" },
      } as Partial<IEntity>);
      const person = await makeEntity(EntityEnums.Class.Person);

      const res = await setAttribute([concept.id, action.id, person.id], {
        attribute: "pos",
        concept: { from: EntityEnums.ConceptPartOfSpeech.Empty, to: EntityEnums.ConceptPartOfSpeech.Noun },
        action: { from: "", to: EntityEnums.ActionPartOfSpeech.Verb },
      });

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("2/3");
      expect(res.body.message).toContain("1 skipped");
      expect(await posOf(concept.id)).toEqual(EntityEnums.ConceptPartOfSpeech.Noun);
      expect(await posOf(action.id)).toEqual(EntityEnums.ActionPartOfSpeech.Verb);
    });
  });

  describe("part of speech with only the Concept side given", () => {
    it("leaves Action entities alone", async () => {
      const concept = await makeEntity(EntityEnums.Class.Concept, {
        data: { pos: EntityEnums.ConceptPartOfSpeech.Noun },
      });
      const action = await makeEntity(EntityEnums.Class.Action, {
        data: { pos: "" },
      } as Partial<IEntity>);

      const res = await setAttribute([concept.id, action.id], {
        attribute: "pos",
        concept: { from: null, to: EntityEnums.ConceptPartOfSpeech.Adj },
      });

      expect(res.status).toEqual(200);
      expect(res.body.message).toContain("1/2");
      expect(await posOf(concept.id)).toEqual(EntityEnums.ConceptPartOfSpeech.Adj);
      expect(await posOf(action.id)).toEqual("");
    });
  });

  describe("an unknown attribute", () => {
    it("is rejected", async () => {
      const concept = await makeEntity(EntityEnums.Class.Concept);

      const res = await setAttribute([concept.id], {
        attribute: "status",
        from: null,
        to: EntityEnums.Status.Approved,
      });

      expect(res.status).toEqual(new BadParams("").statusCode());
      expect(res.body.result).toBe(false);
      expect(res.body.error).toEqual("BadParams");
    });
  });
});
