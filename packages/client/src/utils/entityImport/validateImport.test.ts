import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
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
      { id: "taken", class: "C", labels: ["taken"] },
      { class: "T", labels: ["T"], data: { parent: { territoryId: "nowhere" } } },
      { class: "C", labels: ["dog"], props: [{ type: "ghost" }] },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(plan).toBeNull();
    expect(errors.map((error) => [error.entityIndex, error.path])).toEqual([
      [1, "id"],
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
