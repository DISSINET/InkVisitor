import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference, Relation } from "@inkvisitor/shared/types";
import { AppendConflict, emptySkips } from "./appendMerge";
import { ImportDraft } from "./draft";
import { rebaseAppend, rebaseEntity } from "./rebase";

// updatedAt is a string here, as the server sends it
const entity = (fields: Partial<Omit<IEntity, "updatedAt">> & { updatedAt?: string } = {}) =>
  ({
    id: "wolf",
    class: EntityEnums.Class.Concept,
    labels: ["wolf"],
    notes: [],
    detail: "",
    language: "eng",
    status: "1",
    legacyId: "",
    data: {},
    props: [],
    references: [],
    updatedAt: "t1",
    ...fields,
  }) as unknown as IEntity;

const prop = (id: string, type: string, value: string, children: IProp[] = []) =>
  ({ id, type: { entityId: type }, value: { entityId: value }, children }) as unknown as IProp;

const reference = (id: string, resource: string, value: string) =>
  ({ id, resource, value }) as IReference;

const relation = (id: string, type: RelationEnums.Type, ...entityIds: string[]) =>
  ({ id, type, entityIds }) as Relation.IRelation;

const labelOf = (id: string) => id;

describe("rebaseEntity", () => {
  it("keeps what the draft adds and takes what only the database changed", () => {
    const base = entity({
      labels: ["wolf", "lupus"],
      notes: ["stored note"],
      detail: "a canine",
      props: [prop("p1", "colour", "grey")],
      references: [reference("r1", "book", "p. 1")],
    });
    const ours = entity({
      labels: ["wolf", "lupus", "Wolf (import)"],
      notes: ["stored note", "import note"],
      detail: "a canine",
      props: [
        prop("p1", "colour", "grey", [prop("p2", "shade", "dark")]),
        prop("p3", "size", "big"),
      ],
      references: [reference("r1", "book", "p. 1"), reference("r2", "book", "p. 2")],
    });
    const theirs = entity({
      labels: ["wolf", "canis lupus"],
      notes: ["stored note", "another note"],
      detail: "a wild canine",
      props: [prop("p1", "colour", "grey"), prop("p4", "habitat", "forest")],
      references: [reference("r1", "book", "p. 1")],
      updatedAt: "t2",
    });

    const { entity: rebased, conflicts, notes } = rebaseEntity(base, ours, theirs, [], labelOf);

    expect(rebased.labels).toEqual(["wolf", "canis lupus", "Wolf (import)"]);
    expect(rebased.notes).toEqual(["stored note", "another note", "import note"]);
    expect(rebased.detail).toBe("a wild canine");
    expect(rebased.props.map((item) => item.id)).toEqual(["p1", "p4", "p3"]);
    expect(rebased.props[0].children.map((item) => item.id)).toEqual(["p2"]);
    expect(rebased.references.map((item) => item.id)).toEqual(["r1", "r2"]);
    expect(rebased.updatedAt).toBe("t2");
    expect(conflicts).toEqual([]);
    expect(notes).toEqual([]);
  });

  it("raises a conflict where both changed one value, holding the draft's", () => {
    const base = entity({ detail: "a canine" });
    const ours = entity({ detail: "a dog's cousin" });
    const theirs = entity({ detail: "a wild canine" });

    const { entity: rebased, conflicts } = rebaseEntity(base, ours, theirs, [], labelOf);

    expect(rebased.detail).toBe("a dog's cousin");
    expect(conflicts).toMatchObject([
      { path: "detail", stored: "a wild canine", imported: "a dog's cousin", useImported: true },
    ]);
  });

  it("keeps a settled conflict's choice, with the value stored now as its stored side", () => {
    const base = entity({ detail: "a canine" });
    const settled = {
      path: "detail",
      label: "detail",
      stored: "a canine",
      imported: "a predator",
      storedValue: "a canine",
      importedValue: "a predator",
      useImported: false,
    } as AppendConflict;
    const theirs = entity({ detail: "a wild canine" });

    const keptStored = rebaseEntity(base, base, theirs, [settled], labelOf);
    expect(keptStored.entity.detail).toBe("a wild canine");
    expect(keptStored.conflicts).toMatchObject([
      { stored: "a wild canine", imported: "a predator", useImported: false },
    ]);

    const pickedImport = rebaseEntity(
      base,
      entity({ detail: "a predator" }),
      theirs,
      [{ ...settled, useImported: true }],
      labelOf
    );
    expect(pickedImport.entity.detail).toBe("a predator");
    expect(pickedImport.conflicts).toMatchObject([{ useImported: true }]);

    // the database took the imported value, so nothing is left to settle
    const resolved = rebaseEntity(base, base, entity({ detail: "a predator" }), [settled], labelOf);
    expect(resolved.conflicts).toEqual([]);
  });

  it("keeps the database version of a metaprop changed on both sides, and says so", () => {
    const base = entity({ props: [prop("p1", "colour", "grey")] });
    const ours = entity({ props: [prop("p1", "colour", "white")] });
    const theirs = entity({ props: [prop("p1", "colour", "black")] });

    const { entity: rebased, notes } = rebaseEntity(base, ours, theirs, [], labelOf);

    expect(rebased.props[0].value.entityId).toBe("black");
    expect(notes).toEqual([
      'metaprop "colour": changed here and in the database; it keeps the database version',
    ]);
  });

  it("drops what the database removed and keeps the draft's removals", () => {
    const base = entity({ props: [prop("p1", "colour", "grey"), prop("p2", "size", "big")] });
    const ours = entity({ props: [prop("p1", "colour", "grey")] });
    const theirs = entity({ props: [prop("p2", "size", "big")] });

    expect(rebaseEntity(base, ours, theirs, [], labelOf).entity.props).toEqual([]);
  });
});

describe("rebaseAppend", () => {
  const stored = entity();
  const draftOf = (relations: Relation.IRelation[], storedRelations: Relation.IRelation[]) =>
    ({
      entities: [entity({ notes: ["import note"] })],
      relations,
      existing: {},
      appends: { wolf: { stored, conflicts: [], skipped: emptySkips() } },
      storedRelations,
    }) as ImportDraft;

  it("moves the draft onto the stored entity and stored relations as they are now", () => {
    const scl = relation("s1", RelationEnums.Type.Superclass, "wolf", "animal");
    const ant = relation("s2", RelationEnums.Type.Antonym, "wolf", "dog");
    const syn = relation("s3", RelationEnums.Type.Synonym, "wolf", "lupus");
    const added = relation("s4", RelationEnums.Type.Holonym, "wolf", "pack");
    const draft = draftOf(
      [
        { ...scl, entityIds: ["wolf", "canine"] },
        ant,
        relation("n1", RelationEnums.Type.Antonym, "wolf", "sheep"),
      ],
      [scl, ant, syn]
    );
    const current = entity({ notes: ["stored now"], updatedAt: "t2" });

    const { draft: rebased, notes } = rebaseAppend(
      draft,
      "wolf",
      current,
      [scl, { ...ant, entityIds: ["wolf", "cat"] }, added],
      labelOf
    );

    expect(rebased.entities[0].notes).toEqual(["stored now", "import note"]);
    expect(rebased.appends!.wolf.stored).toBe(current);
    // the edit stays, the database's change replaces the unchanged one, the
    // synonym unlinked here and removed in the database goes, the new one joins
    expect(rebased.relations).toEqual([
      { ...scl, entityIds: ["wolf", "canine"] },
      { ...ant, entityIds: ["wolf", "cat"] },
      relation("n1", RelationEnums.Type.Antonym, "wolf", "sheep"),
      added,
    ]);
    expect(rebased.storedRelations).toEqual([scl, { ...ant, entityIds: ["wolf", "cat"] }, added]);
    expect(notes).toEqual([]);
  });

  it("drops an edit to a stored relation the database removed, and says so", () => {
    const scl = relation("s1", RelationEnums.Type.Superclass, "wolf", "animal");
    const draft = draftOf([{ ...scl, entityIds: ["wolf", "canine"] }], [scl]);

    const { draft: rebased, notes } = rebaseAppend(draft, "wolf", stored, [], labelOf);

    expect(rebased.relations).toEqual([]);
    expect(rebased.storedRelations).toEqual([]);
    expect(notes).toEqual([
      'stored relation Superclass "wolf", "canine": changed here but removed in the database, so it goes',
    ]);
  });
});
