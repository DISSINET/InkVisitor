import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, ITerritory, Relation } from "@inkvisitor/shared/types";
import {
  buildDraftDetail,
  createDraftRelation,
  deleteDraftRelation,
  draftToImportJson,
  ImportDraft,
  mergeChanges,
  missingEntityIds,
  removeDraftEntity,
  updateDraftEntity,
  updateDraftRelation,
} from "./draft";
import { normalizeEntities } from "./normalizeEntities";
import { validateImport } from "./validateImport";

const newEntity = (id: string, extra: Record<string, unknown> = {}) =>
  normalizeEntities([{ id, class: "C", labels: [id], ...extra }], {
    defaultLanguage: EntityEnums.Language.English,
  }).entities[0].entity;

const existingEntity = (id: string) =>
  ({ id, class: EntityEnums.Class.Concept, labels: [id], isTemplate: false }) as IEntity;

const relation = (id: string, type: RelationEnums.Type, ...entityIds: string[]) =>
  ({ id, type, entityIds }) as Relation.IRelation;

const baseDraft = (): ImportDraft => ({
  entities: [newEntity("dog"), newEntity("puppy")],
  relations: [
    relation("r1", RelationEnums.Type.Superclass, "dog", "animal"),
    relation("r2", RelationEnums.Type.Superclass, "puppy", "dog"),
    relation("r3", RelationEnums.Type.Synonym, "hound", "dog"),
  ],
  existing: { animal: existingEntity("animal"), hound: existingEntity("hound") },
});

describe("mergeChanges", () => {
  it("merges nested objects and replaces arrays, as the server does", () => {
    const merged = mergeChanges(
      { labels: ["a", "b"], data: { pos: "noun", extra: 1 } } as Record<string, unknown>,
      { labels: ["c"], data: { pos: "adj" } }
    );
    expect(merged).toEqual({ labels: ["c"], data: { pos: "adj", extra: 1 } });
  });
});

describe("draft edits", () => {
  it("updates an entity and resets the data on a class change", () => {
    let draft = updateDraftEntity(baseDraft(), "dog", { detail: "canine", data: { pos: "adj" } });
    expect(draft.entities[0]).toMatchObject({ detail: "canine", data: { pos: "adj" } });

    draft = updateDraftEntity(draft, "dog", { class: EntityEnums.Class.Person });
    expect(draft.entities[0].class).toBe(EntityEnums.Class.Person);
    expect(draft.entities[0].data).toEqual({});
  });

  it("creates, updates and deletes relations", () => {
    let draft = createDraftRelation(baseDraft(), relation("r4", RelationEnums.Type.Antonym, "dog", "cat"));
    draft = updateDraftRelation(draft, "r4", { entityIds: ["dog", "wolf"] });
    expect(draft.relations.find((item) => item.id === "r4")!.entityIds).toEqual(["dog", "wolf"]);

    draft = deleteDraftRelation(draft, "r4");
    expect(draft.relations.map((item) => item.id)).toEqual(["r1", "r2", "r3"]);
  });

  it("leaves out an entity with every relation it is in", () => {
    const { draft, removedRelations } = removeDraftEntity(baseDraft(), "dog");
    expect(draft.entities.map((entity) => entity.id)).toEqual(["puppy"]);
    expect(draft.relations).toEqual([]);
    expect(removedRelations.map((item) => item.id)).toEqual(["r1", "r2", "r3"]);
  });

  it("removes the links other drafts have to a left-out entity", () => {
    const withLinks = updateDraftEntity(baseDraft(), "puppy", {
      props: newEntity("x", {
        props: [
          { type: "dog", value: "animal", children: [{ type: "size" }] },
          { type: "size", value: "dog", children: [{ type: "dog" }, { type: "size", value: "dog" }] },
        ],
      }).props,
      references: newEntity("x", {
        references: [{ resource: "dog", value: "page" }, { resource: "book", value: "dog" }],
      }).references,
    });

    const { draft, cleanups } = removeDraftEntity(withLinks, "dog");
    const puppy = draft.entities[0];

    // a metaprop typed by dog goes with its children; a value of dog is cleared
    expect(puppy.props).toHaveLength(1);
    expect(puppy.props[0]).toMatchObject({ type: { entityId: "size" }, value: { entityId: "" } });
    expect(puppy.props[0].children.map((child) => [child.type.entityId, child.value.entityId])).toEqual([
      ["size", ""],
    ]);
    expect(puppy.references.map((item) => [item.resource, item.value])).toEqual([["book", ""]]);
    expect(cleanups).toEqual([
      {
        entityId: "puppy",
        changes: [
          "2 metaprops removed",
          "2 metaprop values cleared",
          "1 reference removed",
          "1 reference value cleared",
        ],
      },
    ]);
  });

  it("moves territories under a left-out territory to its parent", () => {
    const territory = (id: string, parentId: string, protocol = {}) =>
      newEntity(id, { class: "T", data: { parent: { territoryId: parentId }, protocol } });
    const draft: ImportDraft = {
      entities: [
        territory("manuscript", "T0"),
        territory("folio", "manuscript", { guidelines: ["manuscript"], startDate: "manuscript" }),
      ],
      relations: [],
      existing: {},
    };

    const { draft: rest, cleanups } = removeDraftEntity(draft, "manuscript");
    const folio = rest.entities[0] as ITerritory;

    expect(folio.data.parent).toMatchObject({ territoryId: "T0" });
    expect(folio.data.protocol).toMatchObject({ guidelines: [], startDate: "" });
    expect(cleanups[0].changes).toEqual([
      "moved to the parent of the left-out territory",
      "2 protocol entries removed",
    ]);
  });
});

describe("buildDraftDetail", () => {
  it("answers like the detail endpoint: own relations, inverse relations, tags", () => {
    const detail = buildDraftDetail(baseDraft(), "dog", UserEnums.RoleMode.Write)!;

    expect(detail.right).toBe(UserEnums.RoleMode.Write);
    expect(detail.relations.SCL!.connections.map((item) => item.id)).toEqual(["r1"]);
    expect(detail.relations.SCL!.iConnections!.map((item) => item.id)).toEqual(["r2"]);
    expect(detail.relations.SYN!.connections.map((item) => item.id)).toEqual(["r3"]);
    // every type is present, so Detail never reads a missing list
    expect(detail.relations.HOL).toEqual({ connections: [], iConnections: [] });
    expect(Object.keys(detail.entities).sort()).toEqual(["animal", "dog", "hound", "puppy"]);
    expect(detail.usedInStatements).toEqual([]);
    expect(detail.warnings).toEqual([]);
  });

  it("answers nothing for an entity no longer in the draft", () => {
    expect(buildDraftDetail(baseDraft(), "cat", UserEnums.RoleMode.Write)).toBeUndefined();
  });
});

describe("draftToImportJson", () => {
  it("lists each relation once, under the entity it belongs to", () => {
    const [dog, puppy] = draftToImportJson(baseDraft()) as { relations: { entityIds: string[] }[] }[];
    expect(dog.relations.map((item) => item.entityIds)).toEqual([
      ["dog", "animal"],
      ["hound", "dog"],
    ]);
    expect(puppy.relations.map((item) => item.entityIds)).toEqual([["puppy", "dog"]]);
  });

  it("passes the import validation, also after a tab with links to it is closed", async () => {
    const context = {
      role: UserEnums.Role.Editor,
      defaultLanguage: EntityEnums.Language.English,
      source: {
        getEntities: async (ids: string[]) =>
          [existingEntity("animal"), existingEntity("hound")].filter((entity) => ids.includes(entity.id)),
        getForwardRelations: async () => [],
      },
    };
    const valid = await validateImport(JSON.stringify(draftToImportJson(baseDraft())), context);
    expect(valid.errors).toEqual([]);
    expect(valid.plan!.relations).toHaveLength(3);

    // puppy's metaprop pointed at dog; closing dog's tab removes it
    const withProp = updateDraftEntity(baseDraft(), "puppy", {
      props: newEntity("x", { props: [{ type: "dog" }] }).props,
    });
    const { draft } = removeDraftEntity(withProp, "dog");
    const rest = await validateImport(JSON.stringify(draftToImportJson(draft)), context);
    expect(rest.errors).toEqual([]);
  });
});

describe("missingEntityIds", () => {
  it("lists referenced entities that are neither drafts nor loaded", () => {
    const draft = updateDraftEntity(baseDraft(), "dog", {
      props: newEntity("x", { props: [{ type: "size", value: "animal" }] }).props,
    });
    expect(missingEntityIds(createDraftRelation(draft, relation("r9", RelationEnums.Type.Antonym, "dog", "cat")))).toEqual([
      "size",
      "cat",
    ]);
  });
});
