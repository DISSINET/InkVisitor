import "ts-jest";
import { randomUUID } from "crypto";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IProp, IPropSpec } from "@inkvisitor/shared/types";
import { countNested, MetapropReplace, replaceMetaprops } from "./batch-replace-metaprop";

const [T, U, X, Y, Z] = ["t", "u", "x", "y", "z"];
const { Elvl, Logic } = EntityEnums;

const spec = (entityId: string): IPropSpec => ({
  entityId,
  elvl: Elvl.Inferential,
  logic: Logic.Positive,
  virtuality: EntityEnums.Virtuality.Reality,
  partitivity: EntityEnums.Partitivity.Unison,
});

// the defaults of a metaprop built by batchAddMetaprop
const prop = (type: string, value: string, extra: Record<string, unknown> = {}): IProp => ({
  id: randomUUID(),
  elvl: Elvl.Inferential,
  certainty: EntityEnums.Certainty.Empty,
  logic: Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],
  type: spec(type),
  value: spec(value),
  ...extra,
});

const withValue = (p: IProp, entityId: string): IProp => ({
  ...p,
  value: { ...p.value, entityId },
});

const changed = (r: MetapropReplace) => {
  if (r.outcome !== "changed") {
    throw new Error(`expected changed, got ${r.outcome}`);
  }
  return r;
};

const reversed = <O extends object>(o: O): O =>
  (Object.keys(o) as (keyof O)[]).reverse().reduce((r, k) => ({ ...r, [k]: o[k] }), {} as O);

describe("replaceMetaprops", () => {
  describe("unmatched", () => {
    test("no top-level (T, X)", () => {
      expect(replaceMetaprops([prop(T, Y), prop(U, X), prop(T, Z)], T, X, Y)).toEqual({
        outcome: "unmatched",
      });
    });

    test("(T, X) only as a subproperty", () => {
      const props = [prop(U, Z, { children: [prop(T, X)] })];
      expect(replaceMetaprops(props, T, X, Y)).toEqual({ outcome: "unmatched" });
      expect(countNested(props, T, X)).toBe(1);
    });

    test("props undefined, and props a legacy empty string", () => {
      const legacy = "" as unknown as IProp[];
      expect(replaceMetaprops(undefined, T, X, Y)).toEqual({ outcome: "unmatched" });
      expect(replaceMetaprops(legacy, T, X, Y)).toEqual({ outcome: "unmatched" });
      expect(countNested(undefined, T, X)).toBe(0);
      expect(countNested(legacy, T, X)).toBe(0);
    });
  });

  describe("rewrite", () => {
    test("the match takes Y and keeps its children, the other prop stays", () => {
      const tX = prop(T, X, { children: [prop(T, X)] });
      const uX = prop(U, X);
      const r = changed(replaceMetaprops([tX, uX], T, X, Y));
      expect(r.props[0].value.entityId).toBe(Y);
      expect(r.props[0].children).toEqual(tX.children);
      expect(r.props[1]).toEqual(uX);
      expect(r).toMatchObject({ items: 1, merged: false });
    });

    test("a negated (T, X) keeps every setting and unknown field", () => {
      const tX = prop(T, X, {
        logic: Logic.Negative,
        certainty: EntityEnums.Certainty.AlmostCertain,
        mood: [EntityEnums.Mood.Question],
        value: { ...spec(X), elvl: Elvl.Interpretive },
        statementOrder: 3,
      });
      expect(replaceMetaprops([tX], T, X, Y)).toEqual({
        outcome: "changed",
        props: [withValue(tX, Y)],
        items: 1,
        merged: false,
      });
    });

    test("(T, X) twice, no (T, Y): both rewritten", () => {
      const props = [prop(T, X), prop(T, X)];
      expect(replaceMetaprops(props, T, X, Y)).toEqual({
        outcome: "changed",
        props: props.map((p) => withValue(p, Y)),
        items: 2,
        merged: false,
      });
    });

    test('(T, "") twice with fromId "": both rewritten', () => {
      const props = [prop(T, ""), prop(T, "")];
      expect(replaceMetaprops(props, T, "", Y)).toEqual({
        outcome: "changed",
        props: props.map((p) => withValue(p, Y)),
        items: 2,
        merged: false,
      });
    });

    test('fromId "": only the empty value is rewritten', () => {
      const [tEmpty, tX] = [prop(T, ""), prop(T, X)];
      expect(replaceMetaprops([tEmpty, tX], T, "", Y)).toEqual({
        outcome: "changed",
        props: [withValue(tEmpty, Y), tX],
        items: 1,
        merged: false,
      });
    });

    test("Review Focus 2: (T, X) and (U, Z) sharing one id, (U, Z) stays", () => {
      const tX = prop(T, X);
      const uZ = prop(U, Z, { id: tX.id });
      const r = changed(replaceMetaprops([tX, uZ], T, X, Y));
      expect(r.props[0]).toEqual(withValue(tX, Y));
      expect(r.props[1]).toEqual(uZ);
    });

    test("the input is unchanged", () => {
      const rewrite = [prop(T, X, { children: [prop(T, X)] }), prop(U, X)];
      const merge = [prop(T, X), prop(T, Y)];
      const [rewriteBefore, mergeBefore] = [structuredClone(rewrite), structuredClone(merge)];
      replaceMetaprops(rewrite, T, X, Y);
      replaceMetaprops(merge, T, X, Y);
      expect(rewrite).toEqual(rewriteBefore);
      expect(merge).toEqual(mergeBefore);
    });
  });

  describe("merge", () => {
    test("(T, X) next to a (T, Y) of the same settings is dropped", () => {
      const tY = prop(T, Y);
      expect(replaceMetaprops([prop(T, X), tY], T, X, Y)).toEqual({
        outcome: "changed",
        props: [tY],
        items: 1,
        merged: true,
      });
    });

    test("(T, X) twice next to (T, Y): both dropped", () => {
      const tY = prop(T, Y);
      expect(replaceMetaprops([prop(T, X), prop(T, X), tY], T, X, Y)).toEqual({
        outcome: "changed",
        props: [tY],
        items: 2,
        merged: true,
      });
    });

    test("two (T, Y), the (T, X) equal to the second only", () => {
      const tY1 = prop(T, Y, { certainty: EntityEnums.Certainty.Probable });
      const tY2 = prop(T, Y);
      expect(replaceMetaprops([tY1, prop(T, X), tY2], T, X, Y)).toEqual({
        outcome: "changed",
        props: [tY1, tY2],
        items: 1,
        merged: true,
      });
    });

    test("Review Focus 2: (T, X) and (T, Y) sharing one id, only (T, X) dropped", () => {
      const tX = prop(T, X);
      const tY = prop(T, Y, { id: tX.id });
      expect(changed(replaceMetaprops([tX, tY], T, X, Y)).props).toEqual([tY]);
    });

    test("(T, Y) holds children, (T, X) none", () => {
      const tY = prop(T, Y, { children: [prop(U, Z)] });
      expect(replaceMetaprops([prop(T, X), tY], T, X, Y)).toEqual({
        outcome: "changed",
        props: [tY],
        items: 1,
        merged: true,
      });
    });

    test('fromId "": (T, "") next to (T, Y)', () => {
      const tY = prop(T, Y);
      expect(replaceMetaprops([prop(T, ""), tY], T, "", Y)).toEqual({
        outcome: "changed",
        props: [tY],
        items: 1,
        merged: true,
      });
    });

    test("objects listing their keys in a different order", () => {
      const tX = prop(T, X);
      const tY = prop(T, Y);
      const reordered = { ...reversed(tX), type: reversed(tX.type), value: reversed(tX.value) };
      expect(Object.keys(reordered)).not.toEqual(Object.keys(tY));
      expect(Object.keys(reordered.value)).not.toEqual(Object.keys(tY.value));
      expect(replaceMetaprops([reordered, tY], T, X, Y)).toEqual({
        outcome: "changed",
        props: [tY],
        items: 1,
        merged: true,
      });
    });
  });

  describe("skip, against a (T, Y) of the defaults", () => {
    test("Review Focus 1: (T, X) with elvl Textual", () => {
      expect(replaceMetaprops([prop(T, X, { elvl: Elvl.Textual }), prop(T, Y)], T, X, Y)).toEqual({
        outcome: "skipped",
      });
    });

    test.each([
      ["type.elvl", { type: { ...spec(T), elvl: Elvl.Textual } }],
      ["value.elvl", { value: { ...spec(X), elvl: Elvl.Textual } }],
      ["certainty", { certainty: EntityEnums.Certainty.Certain }],
      ["logic", { logic: Logic.Negative }],
    ])("%s differs", (_, extra) => {
      expect(replaceMetaprops([prop(T, X, extra), prop(T, Y)], T, X, Y)).toEqual({
        outcome: "skipped",
      });
    });

    test("(T, X) carries statementOrder, (T, Y) does not", () => {
      expect(replaceMetaprops([prop(T, X, { statementOrder: 3 }), prop(T, Y)], T, X, Y)).toEqual({
        outcome: "skipped",
      });
    });

    test("(T, X) with one subproperty", () => {
      const tX = prop(T, X, { children: [prop(U, Z)] });
      expect(replaceMetaprops([tX, prop(T, Y)], T, X, Y)).toEqual({ outcome: "skipped" });
    });

    test("Review Focus 3: one (T, X) droppable, the other with a subproperty", () => {
      const props = [prop(T, X), prop(T, X, { children: [prop(U, Z)] }), prop(T, Y)];
      expect(replaceMetaprops(props, T, X, Y)).toEqual({ outcome: "skipped" });
    });
  });
});

describe("countNested", () => {
  test("a (T, X) at depth 1 and one at depth 2 count, a top-level one does not", () => {
    const props = [
      prop(T, X),
      prop(U, Z, { children: [prop(T, X, { children: [prop(T, X)] }), prop(T, Y)] }),
    ];
    expect(countNested(props, T, X)).toBe(2);
    expect(countNested([prop(T, X)], T, X)).toBe(0);
  });
});
