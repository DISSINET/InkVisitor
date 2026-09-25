import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, ITerritory, Relation } from "@inkvisitor/shared/types";
import { CMetaProp, CReference } from "constructors";
import { buildEntityJson } from "./entityJson";
import { validateImport } from "./validateImport";

const existingEntity = (id: string, entityClass = EntityEnums.Class.Concept) =>
  ({ id, class: entityClass, labels: [id], isTemplate: false }) as IEntity;

const dog: IEntity = {
  id: "dog",
  class: EntityEnums.Class.Concept,
  labels: ["dog"],
  detail: "domestic canine",
  language: EntityEnums.Language.English,
  status: EntityEnums.Status.Approved,
  notes: ["note"],
  data: { pos: EntityEnums.ConceptPartOfSpeech.Noun },
  props: [{ ...CMetaProp({ typeEntityId: "size", valueEntityId: "animal" }) }],
  references: [CReference("book", "page")],
  isTemplate: false,
  createdAt: new Date(),
  legacyId: "legacy",
};

const dogRelations: Relation.IUsedRelations = {
  [RelationEnums.Type.Superclass]: {
    connections: [
      {
        id: "scl-1",
        type: RelationEnums.Type.Superclass,
        entityIds: ["dog", "animal"],
        order: 1,
        subtrees: [
          { id: "scl-2", type: RelationEnums.Type.Superclass, entityIds: ["animal", "being"], order: 1 },
        ],
      },
    ],
    iConnections: [
      { id: "scl-3", type: RelationEnums.Type.Superclass, entityIds: ["puppy", "dog"], order: 1 },
    ],
  },
  [RelationEnums.Type.Synonym]: {
    connections: [{ id: "syn-1", type: RelationEnums.Type.Synonym, entityIds: ["hound", "dog"] }],
  },
};

const database = [
  existingEntity("size"),
  existingEntity("animal"),
  existingEntity("hound"),
  existingEntity("book", EntityEnums.Class.Resource),
  existingEntity("page", EntityEnums.Class.Value),
  existingEntity("catalogue", EntityEnums.Class.Territory),
];

const importJson = (json: object) =>
  validateImport(JSON.stringify(json), {
    role: UserEnums.Role.Admin,
    defaultLanguage: EntityEnums.Language.English,
    source: {
      getEntities: async (ids: string[]) => database.filter((entity) => ids.includes(entity.id)),
      getForwardRelations: async () => [],
    },
  });

/** What a user does with a copy: replace the id wherever it appears. */
const withNewId = (json: object, oldId: string, newId: string) =>
  JSON.parse(JSON.stringify(json).split(`"${oldId}"`).join(`"${newId}"`));

describe("buildEntityJson", () => {
  it("keeps what Detail edits: own first-level relations, no ids of nested objects", () => {
    const json = buildEntityJson(dog, dogRelations);

    expect(json.id).toBe("dog");
    expect(json).not.toHaveProperty("createdAt");
    expect(json).not.toHaveProperty("legacyId");
    expect(json).not.toHaveProperty("isTemplate");
    expect(json.relations).toEqual([
      { type: RelationEnums.Type.Superclass, entityIds: ["dog", "animal"] },
      { type: RelationEnums.Type.Synonym, entityIds: ["hound", "dog"] },
    ]);
    expect((json.props as object[])[0]).not.toHaveProperty("id");
    expect(json.references).toEqual([{ resource: "book", value: "page" }]);
  });

  it("imports back without errors once the id is replaced", async () => {
    const { errors, notes, plan } = await importJson(
      withNewId(buildEntityJson(dog, dogRelations), "dog", "dog-copy")
    );

    expect(errors).toEqual([]);
    expect(notes).toEqual([]);
    expect(plan!.relations).toMatchObject([
      { type: RelationEnums.Type.Superclass, entityIds: ["dog-copy", "animal"] },
      { type: RelationEnums.Type.Synonym, entityIds: ["hound", "dog-copy"] },
    ]);
  });

  it("imported unchanged, reports the existing id", async () => {
    const json = buildEntityJson(dog, dogRelations);
    database.push(existingEntity("dog"));
    const { errors } = await importJson(json);
    database.pop();

    expect(errors.map((error) => error.path)).toEqual(["id"]);
  });

  it("shows a territory without its order, and its validation rules are ignored on import", async () => {
    const territory = {
      ...dog,
      id: "manuscript",
      class: EntityEnums.Class.Territory,
      props: [],
      references: [],
      data: {
        parent: { territoryId: "catalogue", order: 4 },
        protocol: { project: "P1" },
        validations: [{ entityClasses: [] }],
      },
    } as unknown as ITerritory;

    const json = buildEntityJson(territory, {});
    expect(json.data).toEqual({
      parent: { territoryId: "catalogue" },
      protocol: { project: "P1" },
      validations: [{ entityClasses: [] }],
    });

    const { errors, notes } = await importJson(withNewId(json, "manuscript", "manuscript-copy"));
    expect(errors).toEqual([]);
    expect(notes.map((note) => note.path)).toEqual(["data.validations"]);
  });
});
