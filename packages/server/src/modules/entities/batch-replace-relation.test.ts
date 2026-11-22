import "ts-jest";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import {
  canFormCycle,
  leadsTo,
  matchRelationsToReplace,
  replacementOf,
  rowsRelatedTo,
} from "./batch-replace-relation";

const { Classification: CLA, Related: REL } = RelationEnums.Type;
const rel = (
  id: string,
  type: RelationEnums.Type,
  entityIds: string[],
  order?: number
): RelationTypes.IRelation => ({
  id,
  type,
  entityIds,
  ...(order === undefined ? {} : { order }),
});
const ids = (m: Map<string, RelationTypes.IRelation[]>, row: string) =>
  (m.get(row) ?? []).map((r) => r.id);

describe("matchRelationsToReplace", () => {
  const rows = new Set(["row", "row2"]);

  test("asymmetrical: only [row, X] matches", () => {
    const m = matchRelationsToReplace(CLA, "x", rows, [
      rel("a", CLA, ["row", "x"]),
      rel("b", CLA, ["x", "row"]),
      rel("c", CLA, ["row", "other"]),
    ]);
    expect([...m.keys()]).toEqual(["row"]);
    expect(ids(m, "row")).toEqual(["a"]);
  });

  test("X never matches as a row, even with a self-loop", () => {
    const m = matchRelationsToReplace(CLA, "x", new Set(["x", "row"]), [rel("a", CLA, ["x", "x"])]);
    expect(m.size).toBe(0);
  });

  test("a row holding [row, X] twice gets both", () => {
    const m = matchRelationsToReplace(CLA, "x", rows, [
      rel("a", CLA, ["row", "x"]),
      rel("b", CLA, ["row", "x"]),
    ]);
    expect(ids(m, "row")).toEqual(["a", "b"]);
  });

  test("a source outside rowIds is left out", () => {
    const m = matchRelationsToReplace(CLA, "x", rows, [rel("a", CLA, ["stranger", "x"])]);
    expect(m.size).toBe(0);
  });

  test("REL: both orders match the row, [X, X] nothing", () => {
    const m = matchRelationsToReplace(REL, "x", rows, [
      rel("a", REL, ["row", "x"]),
      rel("b", REL, ["x", "row2"]),
      rel("c", REL, ["x", "x"]),
    ]);
    expect(ids(m, "row")).toEqual(["a"]);
    expect(ids(m, "row2")).toEqual(["b"]);
    expect(m.size).toBe(2);
  });

  test("REL with X also in rowIds: [rowA, X] is listed under rowA only", () => {
    const m = matchRelationsToReplace(REL, "x", new Set(["x", "rowA"]), [
      rel("a", REL, ["rowA", "x"]),
    ]);
    expect([...m.keys()]).toEqual(["rowA"]);
    expect(ids(m, "rowA")).toEqual(["a"]);
  });
});

describe("rowsRelatedTo", () => {
  const rows = new Set(["row", "row2"]);

  test("asymmetrical: [row, Y] counts, [Y, row] does not", () => {
    expect(
      rowsRelatedTo(CLA, "y", rows, [rel("a", CLA, ["row", "y"]), rel("b", CLA, ["y", "row2"])])
    ).toEqual(new Set(["row"]));
  });

  test("REL: either order counts", () => {
    expect(
      rowsRelatedTo(REL, "y", rows, [rel("a", REL, ["row", "y"]), rel("b", REL, ["y", "row2"])])
    ).toEqual(new Set(["row", "row2"]));
  });
});

describe("replacementOf", () => {
  test("keeps every field, takes a new id and Y in X's slot", () => {
    expect(replacementOf(rel("r1", CLA, ["row", "x"], 3), "x", "y", "new")).toEqual({
      id: "new",
      type: CLA,
      entityIds: ["row", "y"],
      order: 3,
    });
  });

  test("REL with X in the first slot", () => {
    expect(replacementOf(rel("r1", REL, ["x", "row"]), "x", "y", "new").entityIds).toEqual([
      "y",
      "row",
    ]);
  });

  test("a stored relation without order yields a copy without one", () => {
    const copy = replacementOf(rel("r1", CLA, ["row", "x"]), "x", "y", "new");
    expect("order" in copy).toBe(false);
  });
});

describe("canFormCycle", () => {
  test("only the superordinate entity and superclass types", () => {
    const { SuperordinateEntity: SOE, Superclass: SCL } = RelationEnums.Type;
    expect(RelationEnums.BatchTypes.filter(canFormCycle)).toEqual([SOE, SCL]);
  });
});

describe("leadsTo", () => {
  const e = (a: string, b: string) => ({ entityIds: [a, b] });

  test("plain chain", () => {
    const rels = [e("a", "b"), e("b", "c")];
    expect(leadsTo(rels, "a", "c")).toBe(true);
    expect(leadsTo(rels, "c", "a")).toBe(false);
  });

  test("diamond", () => {
    expect(leadsTo([e("y", "m1"), e("y", "m2"), e("m2", "row")], "y", "row")).toBe(true);
  });

  test("an existing loop and a target outside it", () => {
    expect(leadsTo([e("a", "b"), e("b", "a")], "a", "z")).toBe(false);
  });

  test("a self-loop is walked over", () => {
    expect(leadsTo([e("a", "a"), e("a", "b")], "a", "b")).toBe(true);
    expect(leadsTo([e("a", "a")], "a", "b")).toBe(false);
  });

  test("from === to is false when no relation closes on it", () => {
    expect(leadsTo([e("a", "b")], "a", "a")).toBe(false);
  });
});
