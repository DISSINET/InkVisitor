import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import { CMetaProp, CReference } from "constructors";
import {
  appendChanges,
  applyConflictChoice,
  describeSkips,
  keepStoredIds,
  mergeIntoStored,
  sameEntityBy,
  storedFields,
} from "./appendMerge";

const concept = (overrides: Partial<IEntity> = {}): IEntity => ({
  id: "augustine",
  class: EntityEnums.Class.Person,
  labels: ["Augustine"],
  detail: "",
  language: EntityEnums.Language.Latin,
  status: EntityEnums.Status.Approved,
  notes: [],
  data: {},
  props: [],
  references: [],
  isTemplate: false,
  ...overrides,
});

const value = (id: string, label: string) =>
  ({ id, class: EntityEnums.Class.Value, labels: [label] }) as IEntity;

const prop = (type: string, valueId: string, children: IProp[] = []): IProp => ({
  ...CMetaProp({ typeEntityId: type, valueEntityId: valueId }),
  children,
});

const entities = new Map(
  [value("v-354", "354"), value("v-354-copy", "354"), value("v-430", "430")].map((entity) => [
    entity.id,
    entity,
  ])
);
const same = sameEntityBy((entityId) => entities.get(entityId));

describe("mergeIntoStored", () => {
  it("appends what is missing and counts what is stored already", () => {
    const stored = concept({
      labels: ["Augustine", "Augustinus"],
      notes: ["bishop"],
      props: [prop("born", "v-354")],
      references: [CReference("book", "p1")],
    });
    const imported = concept({
      labels: ["Augustine", "Aurelius Augustinus"],
      notes: ["bishop", "of Hippo"],
      detail: "Church father",
      props: [prop("born", "v-354-copy"), prop("died", "v-430")],
      references: [CReference("book", "p1"), CReference("book", "p2")],
    });

    const { entity, conflicts, skipped } = mergeIntoStored(stored, imported, same, true);

    expect(entity.labels).toEqual(["Augustine", "Augustinus", "Aurelius Augustinus"]);
    expect(entity.notes).toEqual(["bishop", "of Hippo"]);
    expect(entity.detail).toBe("Church father");
    // the Value "354" is the same text under another id
    expect(entity.props.map((item) => item.value.entityId)).toEqual(["v-354", "v-430"]);
    expect(entity.references.map((item) => item.value)).toEqual(["p1", "p2"]);
    expect(conflicts).toEqual([]);
    // language: both Latin
    expect(describeSkips(skipped)).toBe("1 label, 1 note, 1 field, 1 metaprop, 1 reference");
  });

  it("adds a subproperty to a stored property", () => {
    const stored = concept({ props: [prop("born", "v-354", [prop("place", "thagaste")])] });
    const imported = concept({
      props: [prop("born", "v-354", [prop("place", "thagaste", [prop("source", "confessions")])])],
    });

    const { entity, skipped } = mergeIntoStored(stored, imported, same, false);

    expect(entity.props).toHaveLength(1);
    expect(entity.props[0].id).toBe(stored.props[0].id);
    expect(entity.props[0].children[0].children.map((child) => child.type.entityId)).toEqual([
      "source",
    ]);
    expect(skipped.props).toBe(2);
  });

  it("keeps a metaprop of the same type with another value as a new one", () => {
    const stored = concept({ props: [prop("born", "v-354")] });
    const { entity, conflicts } = mergeIntoStored(
      stored,
      concept({ props: [prop("born", "v-430")] }),
      same,
      false
    );
    expect(entity.props).toHaveLength(2);
    expect(conflicts).toEqual([]);
  });

  it("fills empty fields and reports different ones as conflicts holding the stored value", () => {
    const stored = concept({
      class: EntityEnums.Class.Concept,
      labels: ["love"],
      detail: "caritas",
      data: { pos: "" },
    });
    const imported = concept({
      class: EntityEnums.Class.Concept,
      labels: ["amor"],
      detail: "eros",
      language: EntityEnums.Language.English,
      data: { pos: EntityEnums.ConceptPartOfSpeech.Noun },
    });

    const { entity, conflicts } = mergeIntoStored(stored, imported, same, true);

    expect(entity.data.pos).toBe(EntityEnums.ConceptPartOfSpeech.Noun);
    expect(entity.detail).toBe("caritas");
    expect(entity.labels).toEqual(["love", "amor"]);
    expect(conflicts.map((conflict) => [conflict.path, conflict.stored, conflict.imported])).toEqual([
      ["labels[0]", "love", "amor"],
      ["detail", "caritas", "eros"],
      ["language", EntityEnums.Language.Latin, EntityEnums.Language.English],
    ]);
  });

  it("ignores a language the input did not set", () => {
    const { conflicts } = mergeIntoStored(
      concept(),
      concept({ language: EntityEnums.Language.English }),
      same,
      false
    );
    expect(conflicts).toEqual([]);
  });
});

describe("applyConflictChoice", () => {
  it("swaps the main label and keeps the other one as an alternative", () => {
    const conflict = {
      path: "labels[0]",
      label: "main label",
      stored: "love",
      imported: "amor",
      useImported: false,
    };
    const entity = concept({ labels: ["love", "caritas", "amor"] });

    expect(applyConflictChoice(entity, conflict, true).labels).toEqual(["amor", "caritas", "love"]);
    expect(applyConflictChoice(entity, conflict, false).labels).toEqual([
      "love",
      "caritas",
      "amor",
    ]);
  });

  it("sets a data field", () => {
    const conflict = {
      path: "data.logicalType",
      label: "logical type",
      stored: "1",
      imported: "2",
      useImported: false,
    };
    const entity = concept({ data: { logicalType: "1" } });
    expect(applyConflictChoice(entity, conflict, true).data).toEqual({ logicalType: "2" });
  });
});

describe("appendChanges and storedFields", () => {
  it("send only the changed fields, and undo them", () => {
    const stored = concept({ notes: ["bishop"], data: {} });
    const appended = { ...stored, notes: ["bishop", "saint"], data: { logicalType: "1" } };

    const changes = appendChanges(stored, appended);
    expect(changes).toEqual({ notes: ["bishop", "saint"], data: { logicalType: "1" } });
    expect(storedFields(stored, changes)).toEqual({ notes: ["bishop"], data: { logicalType: null } });
  });
});

describe("keepStoredIds", () => {
  it("gives matching metaprops their stored ids back", () => {
    const stored = concept({ props: [prop("born", "v-354", [prop("place", "thagaste")])] });
    const reimported = concept({
      props: [prop("born", "v-354", [prop("place", "thagaste")]), prop("died", "v-430")],
    });

    const result = keepStoredIds(stored, reimported);

    expect(result.props[0].id).toBe(stored.props[0].id);
    expect(result.props[0].children[0].id).toBe(stored.props[0].children[0].id);
    expect(result.props[1].id).toBe(reimported.props[1].id);
  });
});
