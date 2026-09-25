import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, ITerritory, Relation } from "@inkvisitor/shared/types";
import { CMetaProp, CReference } from "constructors";
import { buildImportJson } from "./copyAsImport";
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
  props: [{ ...CMetaProp({ typeEntityId: "size", valueEntityId: "dog" }) }],
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

const importAgain = (json: object) =>
  validateImport(JSON.stringify(json), {
    role: UserEnums.Role.Admin,
    defaultLanguage: EntityEnums.Language.English,
    source: {
      getEntities: async (ids: string[]) => database.filter((entity) => ids.includes(entity.id)),
      getForwardRelations: async () => [],
    },
  });

describe("buildImportJson", () => {
  it("copies the entity with a fresh id and only its own first-level relations", () => {
    const json = buildImportJson(dog, dogRelations);
    const newId = json.id as string;

    expect(newId).not.toBe("dog");
    expect(json).not.toHaveProperty("createdAt");
    expect(json).not.toHaveProperty("legacyId");
    expect(json.relations).toEqual([
      { type: RelationEnums.Type.Superclass, entityIds: [newId, "animal"] },
      { type: RelationEnums.Type.Synonym, entityIds: ["hound", newId] },
    ]);
    expect((json.props as { value: { entityId: string } }[])[0].value.entityId).toBe(newId);
  });

  it("imports again without errors", async () => {
    const { errors, plan } = await importAgain(buildImportJson(dog, dogRelations));

    expect(errors).toEqual([]);
    expect(plan!.entities).toHaveLength(1);
    expect(plan!.relations).toHaveLength(2);
  });

  it("copies a territory without its order and validation rules", async () => {
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

    const json = buildImportJson(territory, {});
    expect(json.data).toEqual({ parent: { territoryId: "catalogue" }, protocol: { project: "P1" } });
    expect((await importAgain(json)).errors).toEqual([]);
  });
});
