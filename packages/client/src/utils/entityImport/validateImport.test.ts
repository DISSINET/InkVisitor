import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { CMetaProp } from "constructors";
import { validateImport } from "./validateImport";

const existingEntity = (id: string, entityClass: EntityEnums.Class) =>
  ({ id, class: entityClass, labels: [id], isTemplate: false }) as IEntity;

const contextWith = (entities: IEntity[], role = UserEnums.Role.Admin) => {
  const getEntities = vi.fn(async (ids: string[]) =>
    entities.filter((entity) => ids.includes(entity.id))
  );
  const getForwardRelations = vi.fn(async () => []);
  return {
    role,
    defaultLanguage: EntityEnums.Language.English,
    source: { getEntities, getForwardRelations },
  };
};

describe("validateImport", () => {
  it("returns the plan for a valid batch, territories after their parents", async () => {
    const context = contextWith([
      existingEntity("animal", EntityEnums.Class.Concept),
      existingEntity("catalogue", EntityEnums.Class.Territory),
    ]);
    const text = JSON.stringify([
      {
        id: "folio",
        class: "T",
        labels: ["Folio 1r"],
        data: { parent: { territoryId: "manuscript" } },
      },
      {
        id: "manuscript",
        class: "T",
        labels: ["Manuscript A"],
        data: { parent: { territoryId: "catalogue" } },
      },
      {
        id: "dog",
        class: "C",
        labels: ["dog"],
        relations: [{ type: "SCL", entityIds: ["dog", "animal"] }],
      },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    expect(plan!.entities.map((entity) => entity.id)).toEqual(["manuscript", "folio", "dog"]);
    expect(plan!.relations).toMatchObject([
      { type: RelationEnums.Type.Superclass, entityIds: ["dog", "animal"] },
    ]);
    expect(Object.keys(plan!.existingEntities).sort()).toEqual(["animal", "catalogue"]);
    // the input ids and the references are checked in one request
    expect(context.source.getEntities).toHaveBeenCalledTimes(1);
  });

  it("collects errors of every kind without a plan", async () => {
    const context = contextWith([existingEntity("taken", EntityEnums.Class.Concept)], UserEnums.Role.Editor);
    const text = JSON.stringify([
      { id: "taken", class: "P", labels: ["taken"] },
      { class: "T", labels: ["T"], data: { parent: { territoryId: "nowhere" } } },
      { class: "C", labels: ["dog"], props: [{ type: "ghost" }] },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(plan).toBeNull();
    expect(errors.map((error) => [error.entityIndex, error.path])).toEqual([
      [1, "class"],
      [2, "data.parent.territoryId"],
      [2, "class"],
      [3, "props[0].type.entityId"],
    ]);
  });

  it("fills in the entity a relation is listed under, so an entity without an id can have relations", async () => {
    const context = contextWith([
      existingEntity("animal", EntityEnums.Class.Concept),
      existingEntity("hound", EntityEnums.Class.Concept),
    ]);
    const text = JSON.stringify([
      {
        class: "C",
        labels: ["TEST dog"],
        relations: [
          { type: "SCL", entityIds: ["animal"] },
          { type: "SYN", entityIds: ["hound"] },
        ],
      },
      { id: "cat", class: "C", labels: ["TEST cat"], relations: [{ type: "SCL", entityIds: ["animal"] }] },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    const dogId = plan!.entities[0].id;
    expect(dogId).toMatch(/^[0-9a-f-]{36}$/);
    expect(plan!.relations.map((relation) => [relation.type, relation.entityIds])).toEqual([
      [RelationEnums.Type.Superclass, [dogId, "animal"]],
      [RelationEnums.Type.Synonym, [dogId, "hound"]],
      [RelationEnums.Type.Superclass, ["cat", "animal"]],
    ]);
  });

  it("removes the links to a left-out statement from the other entities", async () => {
    const context = contextWith([
      existingEntity("animal", EntityEnums.Class.Concept),
      existingEntity("source", EntityEnums.Class.Resource),
    ]);
    const text = JSON.stringify([
      { id: "stmt", class: "S", labels: ["dog barks"] },
      {
        id: "dog",
        class: "C",
        labels: ["dog"],
        props: [{ type: "animal", value: "stmt" }],
        references: [{ resource: "source", value: "stmt" }],
        relations: [
          { type: "SCL", entityIds: ["animal"] },
          { type: "SCL", entityIds: ["stmt"] },
        ],
      },
    ]);

    const { errors, notes, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    const [dog] = plan!.entities;
    expect(dog.props[0].value.entityId).toBe("");
    expect(dog.references[0].value).toBe("");
    expect(plan!.relations.map((relation) => relation.entityIds)).toEqual([["dog", "animal"]]);
    expect(notes.map((note) => [note.entityIndex, note.path])).toEqual([
      [1, "class"],
      [2, undefined],
      [2, "relations[1]"],
    ]);
  });

  it("gives each slot naming a stored Value its own copy, and links a batch Value as is", async () => {
    const context = contextWith([
      existingEntity("stored-12", EntityEnums.Class.Value),
      existingEntity("source", EntityEnums.Class.Resource),
      existingEntity("size", EntityEnums.Class.Concept),
    ]);
    const text = JSON.stringify([
      { id: "new-13", class: "V", labels: ["13"] },
      {
        id: "dog",
        class: "C",
        labels: ["dog"],
        props: [
          { type: "size", value: "stored-12" },
          { type: "size", value: "new-13" },
        ],
        references: [{ resource: "source", value: "stored-12" }],
      },
    ]);

    const { errors, notes, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    const [propCopy, referenceCopy, , dog] = plan!.entities;
    expect([propCopy, referenceCopy]).toMatchObject([
      { class: EntityEnums.Class.Value, labels: ["stored-12"], status: EntityEnums.Status.Approved },
      { class: EntityEnums.Class.Value, labels: ["stored-12"] },
    ]);
    expect(propCopy.id).not.toBe(referenceCopy.id);
    expect(plan!.valueCopyIds).toEqual([propCopy.id, referenceCopy.id]);
    expect(dog.props.map((prop) => prop.value.entityId)).toEqual([propCopy.id, "new-13"]);
    expect(dog.references[0].value).toBe(referenceCopy.id);
    expect(notes.map((note) => [note.entityIndex, note.path])).toEqual([
      [2, "props[0].value.entityId"],
      [2, "references[0].value"],
    ]);
  });

  it("stops at a parse error without asking the database", async () => {
    const context = contextWith([]);
    const { errors } = await validateImport("[", context);

    expect(errors).toHaveLength(1);
    expect(context.source.getEntities).not.toHaveBeenCalled();
  });
});

describe("validateImport appending to a stored entity", () => {
  const stored = {
    ...existingEntity("augustine", EntityEnums.Class.Person),
    labels: ["Augustine"],
    detail: "",
    language: EntityEnums.Language.Latin,
    notes: [],
    data: {},
    references: [],
    updatedAt: "t1",
    props: [
      {
        ...CMetaProp({ typeEntityId: "born", valueEntityId: "v-354" }),
      },
    ],
  } as unknown as IEntity;
  const storedValue = { ...existingEntity("v-354", EntityEnums.Class.Value), labels: ["354"] };

  it("merges the input into the stored entity and leaves out a Value only a skipped metaprop used", async () => {
    const context = contextWith([
      stored,
      storedValue,
      existingEntity("born", EntityEnums.Class.Concept),
      existingEntity("died", EntityEnums.Class.Concept),
    ]);
    const text = JSON.stringify([
      {
        id: "augustine",
        class: "P",
        labels: ["Augustine", "Augustinus"],
        props: [
          { type: "born", value: "new-354" },
          { type: "died", value: "new-430" },
        ],
      },
      { id: "new-354", class: "V", labels: ["354"] },
      { id: "new-430", class: "V", labels: ["430"] },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    expect(plan!.entities.map((entity) => entity.id).sort()).toEqual(["augustine", "new-430"]);
    const augustine = plan!.entities.find((entity) => entity.id === "augustine")!;
    expect(augustine.labels).toEqual(["Augustine", "Augustinus"]);
    expect(augustine.props.map((prop) => prop.value.entityId)).toEqual(["v-354", "new-430"]);
    expect(plan!.appends.augustine.stored).toBe(stored);
    expect(plan!.appends.augustine.skipped).toMatchObject({ labels: 1, props: 1, values: 1 });
  });

  it("creates an input Value with a taken id under a new id, never appending it", async () => {
    const context = contextWith([storedValue, existingEntity("born", EntityEnums.Class.Concept)]);
    const text = JSON.stringify([
      { id: "monica", class: "P", labels: ["Monica"], props: [{ type: "born", value: "v-354" }] },
      { id: "v-354", class: "V", labels: ["332"] },
    ]);

    const { errors, notes, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    expect(plan!.appends).toEqual({});
    const value = plan!.entities.find((entity) => entity.class === EntityEnums.Class.Value)!;
    expect(value.id).not.toBe("v-354");
    expect(value.labels).toEqual(["332"]);
    const monica = plan!.entities.find((entity) => entity.id === "monica")!;
    expect(monica.props[0].value.entityId).toBe(value.id);
    expect(notes.map((note) => note.path)).toContain("id");
  });

  it("checks a new slot naming an entity the stored entity uses elsewhere", async () => {
    const entities = [
      stored,
      storedValue,
      existingEntity("born", EntityEnums.Class.Concept),
      existingEntity("died", EntityEnums.Class.Concept),
      existingEntity("confessions", EntityEnums.Class.Resource),
    ];
    const copied = await validateImport(
      JSON.stringify({
        id: "augustine",
        class: "P",
        labels: ["Augustine"],
        props: [{ type: "died", value: "v-354" }],
      }),
      contextWith(entities)
    );
    expect(copied.errors).toEqual([]);
    expect(copied.plan!.valueCopyIds).toHaveLength(1);
    const augustine = copied.plan!.entities.find((entity) => entity.id === "augustine")!;
    expect(augustine.props[1].value.entityId).toBe(copied.plan!.valueCopyIds[0]);

    const wrongClass = await validateImport(
      JSON.stringify({
        id: "augustine",
        class: "P",
        labels: ["Augustine"],
        references: [{ resource: "confessions", value: "born" }],
      }),
      contextWith(entities)
    );
    expect(wrongClass.errors.map((error) => error.path)).toEqual(["references[0].value"]);
  });

  it("refuses to append to an entity of another class", async () => {
    const context = contextWith([stored]);
    const { errors } = await validateImport(
      JSON.stringify({ id: "augustine", class: "C", labels: ["Augustine"] }),
      context
    );
    expect(errors.map((error) => error.path)).toEqual(["class"]);
  });

  it("takes an already appended draft as final, and stops when the stored entity changed", async () => {
    const draftJson = JSON.stringify({
      id: "augustine",
      class: "P",
      labels: ["Augustine"],
      // v-354 is a stored Value the stored entity already points at: no copy
      props: [{ type: "born", value: "v-354" }],
    });

    const final = await validateImport(draftJson, {
      ...contextWith([stored, storedValue, existingEntity("born", EntityEnums.Class.Concept)]),
      appendTargets: { augustine: stored },
      allowAppend: false,
    });
    expect(final.errors).toEqual([]);
    expect(final.plan!.valueCopyIds).toEqual([]);
    const augustine = final.plan!.entities[0];
    expect(augustine.props[0].id).toBe(stored.props[0].id);
    expect(final.plan!.appends.augustine.conflicts).toEqual([]);

    const changed = await validateImport(draftJson, {
      ...contextWith([
        { ...stored, updatedAt: "t2" } as unknown as IEntity,
        storedValue,
        existingEntity("born", EntityEnums.Class.Concept),
      ]),
      appendTargets: { augustine: stored },
      allowAppend: false,
    });
    expect(changed.errors.map((error) => error.path)).toEqual(["id"]);
  });
});
