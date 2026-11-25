import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, ITerritory, Relation } from "@inkvisitor/shared/types";
import {
  addStoredRelations,
  appendUndoOf,
  buildDraftDetail,
  draftAfterAppend,
  createDraftRelation,
  createDraftWrites,
  deleteDraftRelation,
  draftToImportJson,
  ImportDraft,
  importMarksOf,
  issuesWithEntityIds,
  leftOutDrafts,
  mergeChanges,
  removedFromProtocols,
  missingEntityIds,
  missingSynonymGroupIds,
  reorderDraftRelations,
  replaceEntityId,
  replaceUndoEntityId,
  setAllConflictChoices,
  storedRelationChanges,
  tabEntities,
  toggleLeftOut,
  undoAppend,
  updateDraftEntity,
  updateDraftRelation,
  withLoadedSince,
} from "./draft";
import { normalizeEntities } from "./normalizeEntities";
import { ImportPlan } from "./types";
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

  it("reorders relations by position, which Detail then shows and the import creates in", () => {
    let draft = createDraftRelation(baseDraft(), relation("r4", RelationEnums.Type.Superclass, "dog", "pet"));
    draft = createDraftRelation(draft, relation("r5", RelationEnums.Type.Superclass, "dog", "mammal"));

    // dog's superclasses r1, r4, r5 become r5, r1, r4; the other relations keep their slots
    draft = reorderDraftRelations(draft, ["r5", "r1", "r4"]);
    expect(draft.relations.map((item) => item.id)).toEqual(["r5", "r2", "r3", "r1", "r4"]);

    const detail = buildDraftDetail(draft, "dog", UserEnums.RoleMode.Write)!;
    expect(detail.relations.SCL!.connections.map((item) => item.id)).toEqual(["r5", "r1", "r4"]);
    const [dogJson] = draftToImportJson(draft) as { relations: { type: string; entityIds: string[] }[] }[];
    expect(
      dogJson.relations.filter((item) => item.type === "SCL").map((item) => item.entityIds[1])
    ).toEqual(["mammal", "animal", "pet"]);
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

  it("passes the import validation, also with a linked draft left out", async () => {
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

    // puppy's metaprop points at dog, so leaving dog out leaves puppy out too
    const withProp = updateDraftEntity(baseDraft(), "puppy", {
      props: newEntity("x", { props: [{ type: "dog" }] }).props,
    });
    const withCat = { ...withProp, entities: [...withProp.entities, newEntity("cat")] };
    const rest = await validateImport(
      JSON.stringify(draftToImportJson(toggleLeftOut(withCat, "dog"))),
      context
    );
    expect(rest.errors).toEqual([]);
    expect(rest.plan!.entities.map((entity) => entity.id)).toEqual(["cat"]);
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

describe("createDraftWrites", () => {
  // applies each write to a draft kept here, as the import modal does
  const writesOn = (initial: ImportDraft) => {
    let current = initial;
    const writes = createDraftWrites((update) => {
      current = update(current);
    });
    return { writes, draft: () => current };
  };

  it("writes Detail's edits into the draft, answering like the api", async () => {
    const { writes, draft } = writesOn(baseDraft());
    const dog = draft().entities[0];

    const response = await writes.updateEntity(dog, { detail: "canine" });
    await writes.deleteRelation("r1");

    expect(response.data.result).toBe(true);
    expect(draft().entities[0].detail).toBe("canine");
    expect(draft().relations.map((item) => item.id)).toEqual(["r2", "r3"]);
  });

  it("moves a relation to the index it was dragged to", async () => {
    const { writes, draft } = writesOn(
      createDraftRelation(baseDraft(), relation("r4", RelationEnums.Type.Superclass, "dog", "pet"))
    );
    const siblings = draft().relations.filter((item) => ["r1", "r4"].includes(item.id));

    await writes.moveRelation(siblings, "r4", 0);

    expect(draft().relations.map((item) => item.id)).toEqual(["r4", "r2", "r3", "r1"]);
  });

  it("joins a synonym group: the draft's own one, or a new one", async () => {
    const { writes, draft } = writesOn(baseDraft());
    const [dog, puppy] = draft().entities;
    const dogGroup = draft().relations.find((item) => item.id === "r3")!;

    await writes.joinSynonymGroup(dog, "canine", dogGroup);
    await writes.joinSynonymGroup(puppy, "whelp");

    expect(draft().relations.find((item) => item.id === "r3")!.entityIds).toEqual([
      "hound",
      "dog",
      "canine",
    ]);
    expect(draft().relations.at(-1)).toMatchObject({
      type: RelationEnums.Type.Synonym,
      entityIds: ["puppy", "whelp"],
    });
  });

  it("gives a Value copy no tab and creates it only while a draft points at it", async () => {
    const copy = normalizeEntities([{ id: "copy-12", class: "V", labels: ["12"] }], {
      defaultLanguage: EntityEnums.Language.English,
    }).entities[0].entity;
    const dog = newEntity("dog", { props: [{ type: "size", value: "copy-12" }] });
    const { writes, draft } = writesOn({
      entities: [copy, dog],
      relations: [],
      existing: {},
      valueCopyIds: ["copy-12"],
    });
    const ids = () => draftToImportJson(draft()).map((item) => (item as { id: string }).id);

    expect(tabEntities(draft()).map((entity) => entity.id)).toEqual(["dog"]);
    expect(ids()).toEqual(["copy-12", "dog"]);

    // clearing the slot in Detail leaves the copy unused
    await writes.updateEntity(dog, { props: [{ ...dog.props[0], value: { ...dog.props[0].value, entityId: "" } }] });
    expect(ids()).toEqual(["dog"]);
  });

  // hound is stored in a synonym group with canine
  const withStoredGroup = (): ImportDraft => ({
    ...baseDraft(),
    storedSynonyms: { hound: ["hound", "canine"] },
  });

  it("shows the stored group a draft synonym joins, and asks for the missing ones", () => {
    const detail = buildDraftDetail(withStoredGroup(), "dog", UserEnums.RoleMode.Write)!;

    expect(detail.relations[RelationEnums.Type.Synonym]!.connections[0].entityIds).toEqual([
      "hound",
      "dog",
      "canine",
    ]);
    expect(missingEntityIds(withStoredGroup())).toContain("canine");
    expect(missingSynonymGroupIds(baseDraft())).toEqual(["hound"]);
    expect(missingSynonymGroupIds(withStoredGroup())).toEqual([]);
  });

  it("keeps the stored members out of the draft synonym it edits", async () => {
    const { writes, draft } = writesOn(withStoredGroup());
    const [dog] = draft().entities;
    const shown = buildDraftDetail(draft(), "dog", UserEnums.RoleMode.Write)!.relations[
      RelationEnums.Type.Synonym
    ]!.connections[0];

    await writes.joinSynonymGroup(dog, "pup", shown);

    expect(draft().relations.find((item) => item.id === "r3")!.entityIds).toEqual([
      "hound",
      "dog",
      "pup",
    ]);
  });

  it("removes a draft synonym once the draft leaves its group", async () => {
    const { writes, draft } = writesOn(withStoredGroup());

    // what the cloud's unlink sends for dog: the shown group without it
    await writes.updateRelation("r3", { entityIds: ["hound", "canine"] });

    expect(draft().relations.map((item) => item.id)).toEqual(["r1", "r2"]);
  });
});

describe("replaceEntityId", () => {
  it("swaps the id of a draft wherever the drafts use it, and nothing else", () => {
    const draft: ImportDraft = {
      ...baseDraft(),
      entities: [
        newEntity("dog", { notes: ["dog"] }),
        newEntity("puppy", { props: [{ type: "size", value: "dog" }] }),
      ],
    };

    const swapped = replaceEntityId(draft, "dog", "stored-dog");

    expect(swapped.entities.map((entity) => entity.id)).toEqual(["stored-dog", "puppy"]);
    // a note that holds the same text is no link
    expect(swapped.entities[0].notes).toEqual(["dog"]);
    expect(swapped.entities[1].props[0].value.entityId).toBe("stored-dog");
    expect(swapped.relations.map((item) => item.entityIds)).toEqual([
      ["stored-dog", "animal"],
      ["puppy", "stored-dog"],
      ["hound", "stored-dog"],
    ]);
  });
});

describe("issuesWithEntityIds", () => {
  it("names the draft of each issue by its position in the import JSON", () => {
    const issues = issuesWithEntityIds(baseDraft(), [
      { entityIndex: 2, message: "broken" },
      { message: "about the whole import" },
    ]);
    expect(issues.map((issue) => issue.entityId)).toEqual(["puppy", undefined]);
  });
});

describe("leaving drafts out", () => {
  const withLinks = (): ImportDraft => ({
    ...baseDraft(),
    entities: [
      newEntity("dog"),
      newEntity("puppy", { props: [{ type: "size", value: "v-small" }] }),
      newEntity("kennel", { props: [{ type: "dog", value: "v-small" }] }),
      newEntity("v-small", { class: "V", labels: ["small"] }),
      newEntity("v-loud", { class: "V", labels: ["loud"] }),
      newEntity("bark", { props: [{ type: "size", value: "v-loud" }] }),
    ],
  });
  const jsonIds = (draft: ImportDraft) =>
    draftToImportJson(draft).map((entity) => (entity as { id: string }).id);

  it("leaves out the drafts pointing at a left-out one and the Values only they use", () => {
    let draft = toggleLeftOut(withLinks(), "dog");
    draft = toggleLeftOut(draft, "bark");

    expect(Object.fromEntries(leftOutDrafts(draft))).toEqual({
      dog: "dog",
      // its metaprop type is the dog
      kennel: "dog",
      bark: "bark",
      // only the left-out bark uses it
      "v-loud": "bark",
    });
    expect(jsonIds(draft)).toEqual(["puppy", "v-small"]);
    // puppy still uses the small Value, so it stays; the relations with the
    // dog go, and its synonym cloud keeps too few members to stay
    expect(
      draftToImportJson(draft).flatMap((entity) => (entity as { relations: object[] }).relations)
    ).toEqual([]);
  });

  it("keeps the drafts and relations pointing at a left-out appended draft", () => {
    const draft = toggleLeftOut(
      {
        ...withLinks(),
        appends: { dog: { stored: existingEntity("dog"), conflicts: [], skipped: {} as never } },
      },
      "dog"
    );

    // the dog's stored entity stays in the database, so the kennel's link holds
    expect(Object.fromEntries(leftOutDrafts(draft))).toEqual({ dog: "dog" });
    expect(jsonIds(draft)).toEqual(["puppy", "kennel", "v-small", "v-loud", "bark"]);
    // the puppy's superclass keeps the dog; the dog's own relations go
    expect(
      draftToImportJson(draft).flatMap(
        (entity) => (entity as { relations: { entityIds: string[] }[] }).relations
      )
    ).toEqual([{ type: RelationEnums.Type.Superclass, entityIds: ["puppy", "dog"] }]);
  });

  it("drops a protocol entry naming a left-out draft and keeps the territory", () => {
    const territory = (id: string, data: Record<string, unknown>) =>
      newEntity(id, { class: "T", data }) as ITerritory;
    const draft = toggleLeftOut(
      {
        entities: [
          territory("t1", { protocol: { guidelines: ["rules", "manual"] } }),
          territory("t2", { parent: { territoryId: "t1" } }),
          newEntity("rules", { class: "R" }),
          newEntity("manual", { class: "R" }),
        ],
        relations: [],
        existing: {},
      },
      "rules"
    );

    expect(Object.fromEntries(leftOutDrafts(draft))).toEqual({ rules: "rules" });
    const [t1] = draftToImportJson(draft) as { data: { protocol: { guidelines: string[] } } }[];
    expect(jsonIds(draft)).toEqual(["t1", "t2", "manual"]);
    expect(t1.data.protocol.guidelines).toEqual(["manual"]);
    expect(removedFromProtocols(draft, "rules")).toEqual(["t1"]);
    expect(removedFromProtocols(draft, "manual")).toEqual([]);
  });

  it("brings the drafts left out with one back with it", () => {
    const draft = toggleLeftOut(toggleLeftOut(withLinks(), "dog"), "dog");

    expect(leftOutDrafts(draft).size).toBe(0);
    expect(jsonIds(draft)).toEqual(["dog", "puppy", "kennel", "v-small", "v-loud", "bark"]);
  });
});

describe("undoAppend", () => {
  it("brings back the appended draft only, the other drafts keep their changes", () => {
    const before: ImportDraft = {
      ...baseDraft(),
      entities: [
        newEntity("dog", { detail: "from the import" }),
        newEntity("puppy", { props: [{ type: "size", value: "dog" }] }),
      ],
    };
    const undo = appendUndoOf(before, "dog", "stored-dog");

    // the append: the draft takes the stored id and the stored entity's state
    let appended = replaceEntityId(before, "dog", "stored-dog");
    appended = {
      ...appended,
      entities: appended.entities.map((entity) =>
        entity.id === "stored-dog" ? { ...entity, detail: "stored detail" } : entity
      ),
      appends: {
        "stored-dog": { stored: existingEntity("stored-dog"), conflicts: [], skipped: {} as never },
      },
    };
    // an edit to another draft made after the append
    appended = updateDraftEntity(appended, "puppy", { detail: "edited later" });

    const undone = undoAppend(appended, undo);

    expect(undone.entities.map((entity) => entity.id)).toEqual(["dog", "puppy"]);
    expect(undone.entities[0].detail).toBe("from the import");
    expect(undone.entities[1].detail).toBe("edited later");
    expect(undone.entities[1].props[0].value.entityId).toBe("dog");
    expect(undone.appends).toEqual({});
    expect(undone.relations.map((relation) => relation.entityIds).sort()).toEqual(
      [
        ["dog", "animal"],
        ["hound", "dog"],
        ["puppy", "dog"],
      ].sort()
    );
  });

  it("undoes an earlier append and keeps a later one", () => {
    const before: ImportDraft = {
      ...baseDraft(),
      entities: [
        newEntity("dog", { props: [{ type: "size", value: "puppy" }] }),
        newEntity("puppy"),
        newEntity("kennel", { props: [{ type: "size", value: "dog" }] }),
      ],
      relations: [],
    };
    const stored = (id: string) => ({
      stored: existingEntity(id),
      conflicts: [],
      skipped: {} as never,
    });
    let undoDog = appendUndoOf(before, "dog", "stored-dog");
    let draft = replaceEntityId(before, "dog", "stored-dog");
    draft = { ...draft, appends: { "stored-dog": stored("stored-dog") } };

    // the later appends: the puppy the dog points at, the kennel pointing at the dog
    for (const [fromId, toId] of [
      ["puppy", "stored-puppy"],
      ["kennel", "stored-kennel"],
    ]) {
      draft = replaceEntityId(draft, fromId, toId);
      draft = { ...draft, appends: { ...draft.appends, [toId]: stored(toId) } };
      undoDog = replaceUndoEntityId(undoDog, fromId, toId);
    }

    const undone = undoAppend(draft, undoDog);

    expect(undone.entities.map((entity) => entity.id)).toEqual([
      "dog",
      "stored-puppy",
      "stored-kennel",
    ]);
    expect(undone.entities[0].props[0].value.entityId).toBe("stored-puppy");
    expect(undone.entities[2].props[0].value.entityId).toBe("dog");
    expect(Object.keys(undone.appends!).sort()).toEqual(["stored-kennel", "stored-puppy"]);
  });

  it("keeps, with its edit, a stored relation that also links another appended draft", () => {
    const { Antonym } = RelationEnums.Type;
    const shared = { id: "s1", type: Antonym, entityIds: ["stored-dog", "stored-cat"] };
    const ownOnly = { id: "s2", type: Antonym, entityIds: ["stored-dog", "wolf"] };
    const edited = { ...shared, entityIds: ["stored-cat", "stored-dog"] };
    const before: ImportDraft = {
      ...baseDraft(),
      entities: [newEntity("dog"), newEntity("cat")],
      relations: [],
    };
    const stored = (id: string) => ({ stored: existingEntity(id), conflicts: [], skipped: {} as never });
    let undoDog = appendUndoOf(before, "dog", "stored-dog");
    let draft = replaceEntityId(replaceEntityId(before, "dog", "stored-dog"), "cat", "stored-cat");
    undoDog = replaceUndoEntityId(undoDog, "cat", "stored-cat");
    draft = {
      ...draft,
      appends: { "stored-dog": stored("stored-dog"), "stored-cat": stored("stored-cat") },
      // the shared relation was edited in the drafts
      relations: [edited, ownOnly],
      storedRelations: [shared, ownOnly],
    };

    const undone = undoAppend(draft, undoDog);

    expect(undone.storedRelations).toEqual([shared]);
    expect(undone.relations).toEqual([edited]);
    expect(storedRelationChanges(undone).updated).toEqual([
      { before: shared, changes: { entityIds: ["stored-cat", "stored-dog"] } },
    ]);
  });

  it("keeps an edit that moves a stored relation to or from another appended draft", () => {
    const { Antonym } = RelationEnums.Type;
    const before: ImportDraft = {
      ...baseDraft(),
      entities: [newEntity("dog"), newEntity("cat")],
      relations: [],
    };
    const stored = (id: string) => ({ stored: existingEntity(id), conflicts: [], skipped: {} as never });
    let undoDog = appendUndoOf(before, "dog", "stored-dog");
    let draft = replaceEntityId(replaceEntityId(before, "dog", "stored-dog"), "cat", "stored-cat");
    undoDog = replaceUndoEntityId(undoDog, "cat", "stored-cat");
    // one edit takes the other appended draft out, the other puts it in
    const away = { id: "s1", type: Antonym, entityIds: ["stored-dog", "stored-cat"] };
    const toward = { id: "s2", type: Antonym, entityIds: ["stored-dog", "wolf"] };
    draft = {
      ...draft,
      appends: { "stored-dog": stored("stored-dog"), "stored-cat": stored("stored-cat") },
      relations: [
        { ...away, entityIds: ["stored-dog", "wolf"] },
        { ...toward, entityIds: ["stored-dog", "stored-cat"] },
      ],
      storedRelations: [away, toward],
    };

    const undone = undoAppend(draft, undoDog);

    expect(undone.storedRelations!.map((relation) => relation.id)).toEqual(["s1", "s2"]);
    expect(undone.relations.map((relation) => relation.id)).toEqual(["s1", "s2"]);
    const changes = storedRelationChanges(undone);
    expect(changes.deleted).toEqual([]);
    expect(changes.updated.map(({ before: original }) => original.id)).toEqual(["s1", "s2"]);
  });

  it("keeps once a stored relation the draft was added to, with its later edits", () => {
    const cloud = { id: "s1", type: RelationEnums.Type.Synonym, entityIds: ["stored-dog", "x"] };
    const stored = (id: string) => ({ stored: existingEntity(id), conflicts: [], skipped: {} as never });
    // dog is appended, and cat was added to the stored synonyms of dog
    let draft: ImportDraft = {
      ...baseDraft(),
      entities: [newEntity("stored-dog"), newEntity("cat")],
      relations: [{ ...cloud, entityIds: ["stored-dog", "x", "cat"] }],
      storedRelations: [cloud],
      appends: { "stored-dog": stored("stored-dog") },
    };
    const undoCat = appendUndoOf(draft, "cat", "stored-cat");
    draft = replaceEntityId(draft, "cat", "stored-cat");
    draft = { ...draft, appends: { ...draft.appends, "stored-cat": stored("stored-cat") } };
    // an edit made after the append
    draft = updateDraftRelation(draft, "s1", { entityIds: ["stored-dog", "stored-cat"] });

    const undone = undoAppend(draft, undoCat);

    expect(undone.relations).toEqual([{ ...cloud, entityIds: ["stored-dog", "cat"] }]);
    expect(storedRelationChanges(undone).updated).toEqual([
      { before: cloud, changes: { entityIds: ["stored-dog", "cat"] } },
    ]);
  });
});

describe("withLoadedSince", () => {
  it("adds to a step's result what loaded while the step waited", () => {
    const { Antonym } = RelationEnums.Type;
    const earlier = { id: "s1", type: Antonym, entityIds: ["stored-dog", "cat"] };
    const loaded = { id: "s2", type: Antonym, entityIds: ["stored-cat", "wolf"] };
    const reloaded = { id: "s3", type: Antonym, entityIds: ["stored-dog", "fox"] };
    const base: ImportDraft = {
      ...baseDraft(),
      relations: [earlier],
      storedRelations: [earlier],
      existing: { cat: existingEntity("cat") },
    };
    // what the loaders added meanwhile
    const current: ImportDraft = {
      ...base,
      relations: [earlier, loaded, reloaded],
      storedRelations: [earlier, loaded, reloaded],
      existing: { ...base.existing, wolf: existingEntity("wolf") },
      storedSynonyms: { hound: ["hound", "dog"] },
    };
    // the step's own result, computed from base
    const next: ImportDraft = { ...base, entities: [newEntity("puppy")] };

    const merged = withLoadedSince(next, base, current, "stored-dog");

    expect(merged.entities.map((entity) => entity.id)).toEqual(["puppy"]);
    expect(Object.keys(merged.existing).sort()).toEqual(["cat", "wolf"]);
    expect(merged.storedSynonyms).toEqual({ hound: ["hound", "dog"] });
    // the step loaded the relations of stored-dog itself
    expect(merged.storedRelations).toEqual([earlier, loaded]);
    expect(merged.relations).toEqual([earlier, loaded]);
  });
});

describe("draftAfterAppend", () => {
  it("appends while a left-out draft fails the checks, and keeps that draft as it was", async () => {
    const storedDog = {
      ...existingEntity("stored-dog"),
      detail: "",
      language: EntityEnums.Language.English,
      status: EntityEnums.Status.Approved,
      notes: [],
      data: {},
      references: [],
      props: [],
      updatedAt: "t1",
    } as unknown as IEntity;
    const stored = [storedDog, existingEntity("hound")];
    const context = {
      role: UserEnums.Role.Admin,
      defaultLanguage: EntityEnums.Language.English,
      source: {
        getEntities: async (ids: string[]) => stored.filter((entity) => ids.includes(entity.id)),
        getForwardRelations: async () => [],
      },
      fromDrafts: true,
    };
    const draft: ImportDraft = {
      entities: [
        newEntity("dog"),
        // points at an entity that exists nowhere
        newEntity("monica", { props: [{ type: "missing", value: "missing" }] }),
      ],
      relations: [relation("r1", RelationEnums.Type.Synonym, "hound", "dog", "monica")],
      existing: { hound: existingEntity("hound") },
      leftOutIds: ["monica"],
    };
    const replaced = replaceEntityId(draft, "dog", "stored-dog");
    const withLeftOut = await validateImport(
      JSON.stringify(draftToImportJson({ ...replaced, leftOutIds: [] })),
      context
    );
    expect(withLeftOut.plan).toBeNull();

    const { errors, plan } = await validateImport(
      JSON.stringify(draftToImportJson(replaced)),
      context
    );
    expect(errors).toEqual([]);

    const next = draftAfterAppend(replaced, plan!);
    expect(next.entities.map((entity) => entity.id).sort()).toEqual(["monica", "stored-dog"]);
    expect(next.entities.find((entity) => entity.id === "monica")).toEqual(draft.entities[1]);
    expect(next.leftOutIds).toEqual(["monica"]);
    expect(next.relations.map((item) => [...item.entityIds].sort())).toEqual([
      ["hound", "monica", "stored-dog"],
    ]);
  });

  it("takes a synonym cloud as the validation left it", () => {
    const cloud = {
      id: "c1",
      type: RelationEnums.Type.Synonym,
      entityIds: ["stored-dog", "stored-hound"],
    };
    const previous: ImportDraft = {
      entities: [newEntity("stored-dog"), newEntity("stored-hound")],
      relations: [cloud],
      existing: {},
    };
    // the validation found the cloud in the database and left it out
    const plan: ImportPlan = {
      entities: previous.entities,
      relations: [],
      existingEntities: {},
      valueCopyIds: [],
      appends: {},
    };

    expect(draftAfterAppend(previous, plan).relations).toEqual([]);
  });
});

describe("setAllConflictChoices", () => {
  it("settles every conflict of every appended draft at once", () => {
    const conflict = (stored: string, imported: string) => ({
      path: "detail",
      label: "detail",
      stored,
      imported,
      storedValue: stored,
      importedValue: imported,
      useImported: false,
    });
    const draft: ImportDraft = {
      ...baseDraft(),
      entities: [
        newEntity("dog", { detail: "stored dog" }),
        newEntity("puppy", { detail: "stored puppy" }),
      ],
      appends: {
        dog: {
          stored: existingEntity("dog"),
          conflicts: [conflict("stored dog", "new dog")],
          skipped: {} as never,
        },
        puppy: {
          stored: existingEntity("puppy"),
          conflicts: [conflict("stored puppy", "new puppy")],
          skipped: {} as never,
        },
      },
    };

    const imported = setAllConflictChoices(draft, true);
    expect(imported.entities.map((entity) => entity.detail)).toEqual(["new dog", "new puppy"]);

    const back = setAllConflictChoices(imported, false);
    expect(back.entities.map((entity) => entity.detail)).toEqual(["stored dog", "stored puppy"]);
    expect(back.appends!.dog.conflicts[0].useImported).toBe(false);
  });
});

describe("stored relations of an appended draft", () => {
  const scl = relation("s1", RelationEnums.Type.Superclass, "dog", "animal");
  const syn = relation("s2", RelationEnums.Type.Synonym, "dog", "hound");
  const withStored = (): ImportDraft =>
    addStoredRelations(
      { ...baseDraft(), relations: [], appends: { dog: {} as never } },
      [scl, syn, scl]
    );

  it("shows them in the drafts but never sends them as new relations", () => {
    const draft = withStored();
    expect(draft.relations.map((item) => item.id)).toEqual(["s1", "s2"]);
    const json = draftToImportJson(draft) as { relations: object[] }[];
    expect(json.flatMap((entity) => entity.relations)).toEqual([]);
    expect(storedRelationChanges(draft)).toEqual({ updated: [], deleted: [] });
  });

  it("turns an edit and an unlink into changes to the stored relations", () => {
    let draft = updateDraftRelation(withStored(), "s1", { entityIds: ["dog", "hound"] });
    draft = deleteDraftRelation(draft, "s2");

    expect(storedRelationChanges(draft)).toEqual({
      updated: [{ before: scl, changes: { entityIds: ["dog", "hound"] } }],
      deleted: [syn],
    });
  });

  it("leaves a stored relation with a left-out member as it is stored", () => {
    const draft = toggleLeftOut(deleteDraftRelation(withStored(), "s1"), "dog");
    expect(storedRelationChanges(draft)).toEqual({ updated: [], deleted: [] });
  });

  it("keeps a stored relation unlinked when another appended draft loads it again", () => {
    // hound is appended as well, and its stored relations hold the synonym too
    const draft = addStoredRelations(deleteDraftRelation(withStored(), "s2"), [syn]);

    expect(draft.relations.map((item) => item.id)).toEqual(["s1"]);
    expect(draft.storedRelations!.map((item) => item.id)).toEqual(["s1", "s2"]);
    expect(storedRelationChanges(draft).deleted).toEqual([syn]);
  });
});

describe("importMarksOf", () => {
  it("marks what the append adds and the stored relations edited in the drafts", () => {
    const prop = (id: string, children: IProp[] = []) =>
      ({ id, type: { entityId: "t" }, value: { entityId: "v" }, children }) as unknown as IProp;
    const born = prop("p-born");
    const place = prop("p-place");
    const stored = {
      ...newEntity("dog", { labels: ["dog", "hound"], notes: ["old"] }),
      props: [born],
      references: [{ id: "r-stored", resource: "book", value: "p1" }],
    } as IEntity;
    const appended = {
      ...stored,
      labels: ["dog", "hound", "canine"],
      notes: ["old", "new"],
      props: [{ ...born, children: [place] }, { ...born, id: "p-born-2" }],
      references: [...stored.references, { id: "r-added", resource: "book", value: "p2" }],
    } as IEntity;
    const storedRelation = relation("stored-scl", RelationEnums.Type.Superclass, "dog", "animal");
    const draft: ImportDraft = {
      entities: [appended],
      relations: [
        { ...storedRelation, entityIds: ["dog", "mammal"] },
        relation("added-syn", RelationEnums.Type.Synonym, "dog", "hound"),
      ],
      existing: {},
      appends: { dog: { stored, conflicts: [], skipped: {} as never } },
      storedRelations: [storedRelation],
    };

    const marks = importMarksOf(draft, "dog")!;

    expect([...marks.addedIds]).toEqual(["p-place", "p-born-2", "r-added", "added-syn"]);
    expect([...marks.changedIds]).toEqual(["stored-scl"]);
    expect([...marks.addedLabels]).toEqual(["canine"]);
    expect([...marks.addedNotes]).toEqual(["new"]);
    expect(importMarksOf(draft, "puppy")).toBeUndefined();
  });
});
