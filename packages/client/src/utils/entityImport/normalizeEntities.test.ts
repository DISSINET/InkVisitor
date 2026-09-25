import { EntityEnums } from "@inkvisitor/shared/enums";
import { IConcept, ITerritory } from "@inkvisitor/shared/types";
import { normalizeEntities } from "./normalizeEntities";

const options = { defaultLanguage: EntityEnums.Language.English };

const normalizeOne = (item: Record<string, unknown>) => {
  const result = normalizeEntities([item], options);
  return { ...result, entity: result.entities[0]?.entity };
};

const paths = (issues: { path?: string }[]) => issues.map((issue) => issue.path);

describe("normalizeEntities", () => {
  it("fills a minimal concept with the create-modal defaults", () => {
    const { entity, errors, notes } = normalizeOne({ class: "C", labels: ["dog"] });

    expect(errors).toEqual([]);
    expect(notes).toEqual([]);
    expect(entity.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(entity).toMatchObject({
      class: EntityEnums.Class.Concept,
      labels: ["dog"],
      detail: "",
      language: EntityEnums.Language.English,
      status: EntityEnums.Status.Pending,
      notes: [],
      props: [],
      references: [],
      isTemplate: false,
    });
    expect((entity as IConcept).data).toEqual({ pos: EntityEnums.ConceptPartOfSpeech.Empty });
  });

  it("keeps a provided id and the given fields", () => {
    const { entity, errors } = normalizeOne({
      id: "dog-id",
      class: "C",
      labels: ["dog", "hound"],
      detail: "domestic canine",
      language: "lat",
      status: "1",
      notes: ["from the catalogue"],
      data: { pos: "noun" },
    });

    expect(errors).toEqual([]);
    expect(entity).toMatchObject({
      id: "dog-id",
      labels: ["dog", "hound"],
      detail: "domestic canine",
      language: EntityEnums.Language.Latin,
      status: EntityEnums.Status.Approved,
      notes: ["from the catalogue"],
      data: { pos: EntityEnums.ConceptPartOfSpeech.Noun },
    });
  });

  it("approves a Value by default, as the create modal does", () => {
    expect(normalizeOne({ class: "V", labels: ["12"] }).entity.status).toBe(
      EntityEnums.Status.Approved
    );
  });

  it("rejects unknown fields and hints at the likely one", () => {
    const { errors } = normalizeOne({ class: "C", label: "dog" });
    expect(paths(errors)).toEqual(["label", "labels"]);
    expect(errors[0].message).toContain('"labels"');
  });

  it("ignores server-managed fields with a note", () => {
    const { errors, notes } = normalizeOne({
      class: "C",
      labels: ["dog"],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });
    expect(errors).toEqual([]);
    expect(paths(notes)).toEqual(["createdAt", "updatedAt"]);
  });

  it("rejects template fields that carry a value and notes empty ones", () => {
    const rejected = normalizeOne({
      class: "C",
      labels: ["dog"],
      isTemplate: true,
      usedTemplate: "tpl",
      legacyId: "old-1",
    });
    expect(paths(rejected.errors)).toEqual(["isTemplate", "usedTemplate", "legacyId"]);

    const ignored = normalizeOne({
      class: "C",
      labels: ["dog"],
      isTemplate: false,
      usedTemplate: "",
      templateData: {},
    });
    expect(ignored.errors).toEqual([]);
    expect(paths(ignored.notes)).toEqual(["isTemplate", "usedTemplate", "templateData"]);

    // database rows also store "not a template" as 0 or ""
    expect(normalizeOne({ class: "C", labels: ["dog"], isTemplate: 0 }).errors).toEqual([]);
    expect(normalizeOne({ class: "C", labels: ["dog"], isTemplate: "" }).errors).toEqual([]);
  });

  it("rejects statements and unknown classes", () => {
    expect(paths(normalizeOne({ class: "S", labels: ["s"] }).errors)).toEqual(["class"]);
    expect(paths(normalizeOne({ class: "Concept", labels: ["s"] }).errors)).toEqual(["class"]);
    expect(paths(normalizeOne({ labels: ["s"] }).errors)).toEqual(["class"]);
  });

  it("checks labels, language, status, notes and id", () => {
    expect(paths(normalizeOne({ class: "C" }).errors)).toEqual(["labels"]);
    expect(paths(normalizeOne({ class: "C", labels: "dog" }).errors)).toEqual(["labels"]);
    expect(paths(normalizeOne({ class: "C", labels: [""] }).errors)).toEqual(["labels"]);
    expect(paths(normalizeOne({ class: "C", labels: ["d"], language: "english" }).errors)).toEqual([
      "language",
    ]);
    expect(paths(normalizeOne({ class: "C", labels: ["d"], status: "approved" }).errors)).toEqual([
      "status",
    ]);
    expect(paths(normalizeOne({ class: "C", labels: ["d"], notes: "n" }).errors)).toEqual(["notes"]);
    expect(paths(normalizeOne({ class: "C", labels: ["d"], id: "has space" }).errors)).toEqual([
      "id",
    ]);
  });

  it("fills metaprops with the Detail defaults and accepts id shorthands", () => {
    const { entity, errors } = normalizeOne({
      class: "C",
      labels: ["dog"],
      props: [
        {
          id: "ignored",
          type: "type-id",
          value: { entityId: "value-id", elvl: "1" },
          children: [{ type: { entityId: "child-type" } }],
        },
      ],
    });

    expect(errors).toEqual([]);
    const prop = entity.props[0];
    expect(prop.id).not.toBe("ignored");
    expect(prop).toMatchObject({
      elvl: EntityEnums.Elvl.Inferential,
      certainty: EntityEnums.Certainty.Empty,
      logic: EntityEnums.Logic.Positive,
      mood: [EntityEnums.Mood.Indication],
      type: { entityId: "type-id", elvl: EntityEnums.Elvl.Inferential },
      value: { entityId: "value-id", elvl: EntityEnums.Elvl.Textual },
    });
    expect(prop.children[0].type.entityId).toBe("child-type");
    expect(prop.children[0].value.entityId).toBe("");
  });

  it("reports metaprop problems with their paths", () => {
    const { errors } = normalizeOne({
      class: "C",
      labels: ["dog"],
      props: [
        { value: "v" },
        { type: "t", elvl: "9", color: "red" },
        {
          type: "t",
          children: [{ type: "t", children: [{ type: "t", children: [{ type: "t" }] }] }],
        },
      ],
    });

    expect(paths(errors)).toEqual([
      "props[0].type",
      "props[1].elvl",
      "props[1].color",
      "props[2].children[0].children[0].children",
    ]);
  });

  it("checks references", () => {
    const { entity, errors } = normalizeOne({
      class: "C",
      labels: ["dog"],
      references: [{ resource: "r-id", value: "v-id" }, { resource: "r-id" }, { value: "v-id" }],
    });

    expect(paths(errors)).toEqual(["references[2].resource"]);
    expect(entity.references[0]).toMatchObject({ resource: "r-id", value: "v-id" });
    expect(entity.references[1]).toMatchObject({ resource: "r-id", value: "" });
  });

  it("checks class data", () => {
    expect(paths(normalizeOne({ class: "C", labels: ["d"], data: { pos: "x" } }).errors)).toEqual([
      "data.pos",
    ]);
    expect(
      paths(normalizeOne({ class: "P", labels: ["d"], data: { logicalType: "9", pos: "noun" } }).errors)
    ).toEqual(["data.logicalType", "data.pos"]);
    expect(
      paths(normalizeOne({ class: "R", labels: ["d"], data: { url: "u", documentId: "doc" } }).errors)
    ).toEqual(["data.documentId"]);

    const action = normalizeOne({
      class: "A",
      labels: ["hit"],
      data: { valencies: { s: "someone" }, entities: { a1: ["P", "*"] } },
    });
    expect(action.errors).toEqual([]);
    expect(action.entity.data).toEqual({
      pos: EntityEnums.ActionPartOfSpeech.Verb,
      valencies: { s: "someone", a1: "", a2: "" },
      entities: { a1: ["P", "*"] },
    });
    expect(
      paths(normalizeOne({ class: "A", labels: ["hit"], data: { entities: { a1: ["Q"] } } }).errors)
    ).toEqual(["data.entities.a1"]);
  });

  it("requires a parent for territories and ignores their order", () => {
    const { entity, errors, notes } = normalizeOne({
      class: "T",
      labels: ["Manuscript A"],
      data: { parent: { territoryId: "catalogue", order: 3 }, protocol: { project: "P1" } },
    });

    expect(errors).toEqual([]);
    expect(paths(notes)).toEqual(["data.parent.order"]);
    const territory = entity as ITerritory;
    expect(territory.data.parent).toEqual({
      territoryId: "catalogue",
      order: EntityEnums.Order.Last,
    });
    expect(territory.data.protocol).toMatchObject({ project: "P1", guidelines: [] });

    expect(paths(normalizeOne({ class: "T", labels: ["T"] }).errors)).toEqual(["data.parent"]);
    expect(
      paths(
        normalizeOne({
          class: "T",
          labels: ["T"],
          data: { parent: { territoryId: "p" }, validations: [{}] },
        }).errors
      )
    ).toEqual(["data.validations"]);
  });

  it("rejects a relations field that is neither a list nor grouped by type", () => {
    expect(paths(normalizeOne({ class: "C", labels: ["d"], relations: "SCL" }).errors)).toEqual([
      "relations",
    ]);
  });

  it("reads relations grouped by type as the JSON section of Detail shows them", () => {
    const { entities, errors, notes } = normalizeEntities(
      [
        {
          class: "C",
          labels: ["dog"],
          relations: {
            SCL: {
              connections: [{ id: "r1", type: "SCL", entityIds: ["dog", "animal"], subtrees: [] }],
              iConnections: [{ entityIds: ["puppy", "dog"] }],
            },
            SYN: { connections: [] },
          },
        },
      ],
      options
    );

    expect(errors).toEqual([]);
    // relations pointing at the entity are left to the entity they start at
    expect(entities[0].rawRelations).toEqual([
      {
        path: "relations.SCL.connections[0]",
        raw: { id: "r1", type: "SCL", entityIds: ["dog", "animal"], subtrees: [] },
      },
    ]);
    expect(notes.map((note) => note.path)).toEqual(["relations.SCL.iConnections"]);
  });

  it("reports grouped relations with a wrong type or shape", () => {
    const { errors } = normalizeOne({
      class: "C",
      labels: ["dog"],
      relations: {
        XYZ: { connections: [] },
        SCL: { connections: [{ type: "SYN", entityIds: ["a", "b"] }], other: [] },
        ANT: [],
      },
    });

    expect(paths(errors)).toEqual([
      "relations.XYZ",
      "relations.SCL.other",
      "relations.SCL.connections[0].type",
      "relations.ANT",
    ]);
  });

  it("drops the fields the Detail view adds to an entity, with one note", () => {
    const { errors, notes } = normalizeOne({
      class: "C",
      labels: ["dog"],
      usedInStatements: [],
      warnings: [],
      entities: {},
      right: "write",
    });

    expect(errors).toEqual([]);
    expect(notes.map((note) => note.path)).toEqual(["usedInStatements, warnings, entities, right"]);
  });
});
