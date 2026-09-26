import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { normalizeEntities } from "./normalizeEntities";
import {
  collectEntityRefs,
  validateBatchIds,
  validateEntityRefs,
} from "./references";

const normalize = (items: Record<string, unknown>[]) =>
  normalizeEntities(items, { defaultLanguage: EntityEnums.Language.English }).entities;

const existingEntity = (id: string, entityClass: EntityEnums.Class, isTemplate = false) =>
  ({ id, class: entityClass, labels: [id], isTemplate }) as IEntity;

const toMap = (entities: IEntity[]) => new Map(entities.map((entity) => [entity.id, entity]));

describe("collectEntityRefs", () => {
  it("collects ids from nested props, references and territory data", () => {
    const [entity] = normalize([
      {
        class: "T",
        labels: ["Manuscript"],
        props: [{ type: "t1", value: "v1", children: [{ type: "t2", children: [{ type: "t3" }] }] }],
        references: [{ resource: "r1", value: "val1" }, { resource: "r2" }],
        data: {
          parent: { territoryId: "parent-t" },
          protocol: { guidelines: ["g1"], dataCollectionMethods: ["m1"], startDate: "d1", endDate: "" },
        },
      },
    ]);

    const refs = collectEntityRefs([entity]);
    expect(refs.map((ref) => [ref.path, ref.id, ref.classes])).toEqual([
      ["props[0].type.entityId", "t1", undefined],
      ["props[0].value.entityId", "v1", undefined],
      ["props[0].children[0].type.entityId", "t2", undefined],
      ["props[0].children[0].children[0].type.entityId", "t3", undefined],
      ["references[0].resource", "r1", [EntityEnums.Class.Resource]],
      ["references[0].value", "val1", [EntityEnums.Class.Value]],
      ["references[1].resource", "r2", [EntityEnums.Class.Resource]],
      ["data.parent.territoryId", "parent-t", [EntityEnums.Class.Territory]],
      ["data.protocol.dataCollectionMethods[0]", "m1", [EntityEnums.Class.Concept]],
      ["data.protocol.guidelines[0]", "g1", [EntityEnums.Class.Resource]],
      ["data.protocol.startDate", "d1", [EntityEnums.Class.Value]],
    ]);
  });
});

describe("validateEntityRefs", () => {
  const entities = normalize([
    {
      id: "dog",
      class: "C",
      labels: ["dog"],
      props: [{ type: "size", value: "animal" }],
      references: [{ resource: "book", value: "page" }],
    },
    { id: "animal", class: "C", labels: ["animal"] },
  ]);
  const batch = new Map(entities.map((item) => [item.entity.id, item.entity]));

  it("accepts ids of the batch and of the database", () => {
    const existing = toMap([
      existingEntity("size", EntityEnums.Class.Concept),
      existingEntity("book", EntityEnums.Class.Resource),
      existingEntity("page", EntityEnums.Class.Value),
    ]);
    expect(validateEntityRefs(collectEntityRefs(entities), batch, existing)).toEqual([]);
  });

  it("reports missing ids, templates and wrong classes", () => {
    const existing = toMap([
      existingEntity("size", EntityEnums.Class.Concept, true),
      existingEntity("book", EntityEnums.Class.Concept),
    ]);
    const errors = validateEntityRefs(collectEntityRefs(entities), batch, existing);

    expect(errors.map((error) => [error.entityIndex, error.path])).toEqual([
      [1, "props[0].type.entityId"],
      [1, "references[0].resource"],
      [1, "references[0].value"],
    ]);
    expect(errors[0].message).toContain("template");
    expect(errors[1].message).toContain("Resource");
    expect(errors[2].message).toContain("not found");
  });
});

describe("validateBatchIds", () => {
  it("reports ids used twice in the input or already in the database", () => {
    const entities = normalize([
      { id: "a", class: "C", labels: ["a"] },
      { id: "a", class: "C", labels: ["a again"] },
      { id: "taken", class: "C", labels: ["taken"] },
    ]);
    const errors = validateBatchIds(entities, new Set(["taken"]));

    expect(errors.map((error) => [error.entityIndex, error.path])).toEqual([
      [2, "id"],
      [3, "id"],
    ]);
    expect(errors[0].message).toContain("entity 1");
    expect(errors[1].message).toContain("already exists");
  });
});
