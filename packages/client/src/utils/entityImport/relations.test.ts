import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { normalizeEntities } from "./normalizeEntities";
import { normalizeRelationItems, validateRelations } from "./relations";

const { Superclass, Synonym, Holonym, Classification, ActionEventEquivalent } =
  RelationEnums.Type;

const normalize = (items: Record<string, unknown>[]) =>
  normalizeEntities(items, { defaultLanguage: EntityEnums.Language.English }).entities;

const concept = (id: string, relations: unknown[] = []) => ({
  id,
  class: "C",
  labels: [id],
  relations,
});

const existingEntity = (
  id: string,
  entityClass = EntityEnums.Class.Concept,
  isTemplate = false
) => ({ id, class: entityClass, labels: [id], isTemplate }) as IEntity;

const relation = (type: RelationEnums.Type, ...entityIds: string[]) => ({ type, entityIds });

/** A database with the given entities and relations, answering like the server. */
const database = (entities: IEntity[], relations: Relation.IRelation[] = []) => {
  const existing = new Map(entities.map((entity) => [entity.id, entity]));
  const getForwardRelations = vi.fn(async (entityId: string, type: RelationEnums.Type) =>
    relations.filter(
      (candidate) =>
        candidate.type === type &&
        (Relation.RelationRules[type]!.asymmetrical
          ? candidate.entityIds[0] === entityId
          : candidate.entityIds.includes(entityId))
    )
  );
  return { existing, source: { getForwardRelations } };
};

const dbRelation = (type: RelationEnums.Type, ...entityIds: string[]): Relation.IRelation => ({
  id: `db-${entityIds.join("-")}`,
  type,
  entityIds,
});

const run = async (
  items: Record<string, unknown>[],
  db: ReturnType<typeof database> = database([])
) => {
  const entities = normalize(items);
  const normalized = normalizeRelationItems(entities);
  const result = await validateRelations(normalized.items, entities, db.existing, db.source);
  return {
    ...result,
    shapeErrors: normalized.errors,
    shapeNotes: normalized.notes,
    pairs: result.relations.map((created) => `${created.type} ${created.entityIds.join(">")}`),
  };
};

describe("normalizeRelationItems", () => {
  it("checks the shape of each relation", () => {
    const entities = normalize([
      concept("dog", [
        "SCL",
        { type: "Superclass", entityIds: ["dog", "animal"] },
        { type: "SCL", entityIds: ["dog", "animal", "mammal"] },
        { type: "SCL", entityIds: ["dog", "animal"], certainty: "1" },
        { type: "SYN", entityIds: ["dog"] },
        { type: "SCL", entityIds: ["dog", "animal"], color: "red" },
      ]),
    ]);
    const { items, errors } = normalizeRelationItems(entities);

    expect(items).toEqual([]);
    expect(errors.map((error) => error.path)).toEqual([
      "relations[0]",
      "relations[1].type",
      "relations[2].entityIds",
      "relations[3].certainty",
      "relations[4].entityIds",
      "relations[5].color",
    ]);
  });

  it("builds relations with fresh ids, a default certainty and without subtrees", () => {
    const entities = normalize([
      concept("dog", [
        { id: "old", order: 3, type: "SCL", entityIds: ["dog", "animal"], subtrees: [{}] },
        { type: "IDE", entityIds: ["dog", "hound"] },
      ]),
    ]);
    const { items, errors, notes } = normalizeRelationItems(entities);

    expect(errors).toEqual([]);
    expect(notes.map((note) => note.path)).toEqual(["relations[0].subtrees"]);
    expect(items[0].relation.id).not.toBe("old");
    expect(items[0].relation).not.toHaveProperty("order");
    expect(items[1].relation).toMatchObject({ certainty: EntityEnums.Certainty.Certain });
  });
});

describe("validateRelations", () => {
  it("creates a valid relation between a new and an existing entity", async () => {
    const { pairs, errors, notes } = await run(
      [concept("dog", [relation(Superclass, "dog", "animal")])],
      database([existingEntity("animal")])
    );

    expect(errors).toEqual([]);
    expect(notes).toEqual([]);
    expect(pairs).toEqual(["SCL dog>animal"]);
  });

  it("reports missing entities, templates, self links and class patterns", async () => {
    const { errors } = await run(
      [
        concept("dog", [
          relation(Superclass, "dog", "ghost"),
          relation(Superclass, "dog", "template"),
          relation(Superclass, "dog", "dog"),
          relation(Superclass, "dog", "rex"),
          relation(Synonym, "dog", "rex"),
        ]),
      ],
      database([
        existingEntity("template", EntityEnums.Class.Concept, true),
        existingEntity("rex", EntityEnums.Class.Person),
      ])
    );

    expect(errors.map((error) => error.path)).toEqual([
      "relations[0].entityIds",
      "relations[1].entityIds",
      "relations[2].entityIds",
      "relations[3].entityIds",
      "relations[4].entityIds",
    ]);
    expect(errors[0].message).toContain("not found");
    expect(errors[1].message).toContain("template");
    expect(errors[2].message).toContain("itself");
    expect(errors[3].message).toBe(
      "Superclass links Action → Action, Concept → Concept; got Concept → Person"
    );
    expect(errors[4].message).toContain("Synonym links Action only, Concept only");
  });

  it("requires a non-tree relation to include its entity and drops relations starting at an existing entity", async () => {
    const { pairs, errors, notes } = await run(
      [
        concept("dog", [
          relation(RelationEnums.Type.Antonym, "cat", "animal"),
          relation(Superclass, "mammal", "animal"),
        ]),
      ],
      database([existingEntity("cat"), existingEntity("mammal"), existingEntity("animal")])
    );

    expect(pairs).toEqual([]);
    expect(errors.map((error) => error.message)).toEqual(["must include the id of this entity"]);
    expect(notes.map((note) => note.message)).toEqual([
      'Superclass "mammal" → "animal": ignored, "mammal" is an existing entity; add it in its Detail',
    ]);
  });

  it("never gives an existing entity a new directional relation", async () => {
    const { pairs, notes } = await run(
      [
        concept("mammal", [
          relation(Superclass, "dog", "mammal"),
          relation(Superclass, "cat", "mammal"),
        ]),
        concept("cat"),
      ],
      database([existingEntity("dog")])
    );

    // a new source is fine wherever the relation is written
    expect(pairs).toEqual(["SCL cat>mammal"]);
    expect(notes.map((note) => note.message)).toEqual([
      'Superclass "dog" → "mammal": ignored, "dog" is an existing entity; add it in its Detail',
    ]);
  });

  it("merges duplicates and synonym groups sharing a member", async () => {
    const { pairs, notes } = await run(
      [
        concept("dog", [
          relation(RelationEnums.Type.Antonym, "dog", "cat"),
          relation(Synonym, "dog", "hound"),
        ]),
        concept("cat", [relation(RelationEnums.Type.Antonym, "cat", "dog")]),
        concept("doggo", [relation(Synonym, "doggo", "hound")]),
      ],
      database([existingEntity("hound")])
    );

    expect(pairs).toEqual(["ANT dog>cat", "SYN dog>hound>doggo"]);
    expect(notes.map((note) => note.message)).toEqual([
      'synonym relations merged into one group: "dog", "hound", "doggo"',
      "duplicate of relations[0] of entity 1, merged into it",
    ]);
  });

  it("keeps only the first level of a tree, with database edges", async () => {
    const { pairs, notes } = await run(
      [
        concept("dog", [
          relation(Superclass, "dog", "mammal"),
          relation(Superclass, "dog", "animal"),
          relation(Superclass, "dog", "pet"),
        ]),
      ],
      database(
        [existingEntity("mammal"), existingEntity("animal"), existingEntity("pet")],
        [dbRelation(Superclass, "mammal", "vertebrate"), dbRelation(Superclass, "vertebrate", "animal")]
      )
    );

    expect(pairs).toEqual(["SCL dog>mammal", "SCL dog>pet"]);
    expect(notes.map((note) => note.message)).toEqual([
      'Superclass "dog" → "animal": ignored, already implied via "mammal"',
    ]);
  });

  it("keeps only the first level of a tree written entirely in the input", async () => {
    const { pairs } = await run([
      concept("dog", [relation(Superclass, "dog", "mammal"), relation(Superclass, "dog", "animal")]),
      concept("mammal", [relation(Superclass, "mammal", "animal")]),
      concept("animal"),
    ]);

    expect(pairs).toEqual(["SCL dog>mammal", "SCL mammal>animal"]);
  });

  it("trims classifications implied through the superclass tree", async () => {
    const { pairs, notes } = await run(
      [
        {
          id: "rex",
          class: "P",
          labels: ["rex"],
          relations: [relation(Classification, "rex", "dog"), relation(Classification, "rex", "animal")],
        },
      ],
      database(
        [existingEntity("dog"), existingEntity("animal")],
        [dbRelation(Superclass, "dog", "animal")]
      )
    );

    expect(pairs).toEqual(["CLA rex>dog"]);
    expect(notes.map((note) => note.message)).toEqual([
      'Classification "rex" → "animal": ignored, already implied via "dog"',
    ]);
  });

  it("reports a loop inside the input once, naming each edge", async () => {
    const { errors } = await run([
      concept("wheel", [relation(Holonym, "wheel", "car")]),
      concept("car", [relation(Holonym, "car", "engine")]),
      concept("engine", [relation(Holonym, "engine", "wheel")]),
    ]);

    expect(errors.map((error) => error.message)).toEqual([
      [
        "Holonym loop:",
        '  "wheel" → "car"   (JSON, entity 1)',
        '  "car" → "engine"   (JSON, entity 2)',
        '  "engine" → "wheel"   (JSON, entity 3)',
      ].join("\n"),
    ]);
  });

  it("cannot close a loop through database edges, the edge back into the input is ignored", async () => {
    const { errors, pairs } = await run(
      [concept("x", [relation(Superclass, "x", "a"), relation(Superclass, "b", "x")])],
      database([existingEntity("a"), existingEntity("b")], [dbRelation(Superclass, "a", "b")])
    );

    expect(errors).toEqual([]);
    expect(pairs).toEqual(["SCL x>a"]);
  });

  it("allows one relation per entity where the type says so", async () => {
    const { errors } = await run(
      [
        {
          id: "hit",
          class: "A",
          labels: ["hit"],
          relations: [
            relation(ActionEventEquivalent, "hit", "blow"),
            relation(RelationEnums.Type.PropertyReciprocal, "hit", "hit"),
          ],
        },
        {
          id: "strike",
          class: "A",
          labels: ["strike"],
          relations: [
            relation(ActionEventEquivalent, "strike", "blow"),
            relation(ActionEventEquivalent, "strike", "punch"),
          ],
        },
      ],
      database([existingEntity("blow"), existingEntity("punch")])
    );

    expect(errors.map((error) => [error.entityIndex, error.message])).toEqual([
      [1, "Property Reciprocal links Concept – Concept; got Action – Action"],
      [2, '"strike" can have only one Action/Event Equivalent relation'],
    ]);
  });

  it("notes a synonym group that joins synonyms in the database", async () => {
    const { notes } = await run(
      [concept("dog", [relation(Synonym, "dog", "hound")])],
      database(
        [existingEntity("hound"), existingEntity("canine")],
        [dbRelation(Synonym, "hound", "canine")]
      )
    );

    expect(notes.map((note) => note.message)).toEqual([
      'Synonym "dog", "hound": joins the synonyms already in the database (2 entities in all)',
    ]);
  });
});
