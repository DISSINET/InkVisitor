import { IProp, IReference } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import {
  fillColumnWidths,
  getTagLabelMaxWidth,
  hasPropPair,
  hasReferencePair,
  withoutNthPropPair,
  withoutReferencePair,
} from "./utils";

const column = (
  id: string,
  type: Explore.EExploreColumnType,
  editable = false,
): Explore.IExploreColumn => ({ id, name: id, type, editable, params: {} });

const origins = column("origins", Explore.EExploreColumnType.EPO);
// a narrow type: 160px when no width was estimated for it
const status = column("status", Explore.EExploreColumnType.EST);

describe("fillColumnWidths", () => {
  it("a single column takes all the room the entity column leaves", () => {
    expect(fillColumnWidths([origins], { origins: 200 }, 1000, 280)).toEqual({ origins: 720 });
  });

  it("columns share the free room in equal parts on top of their own widths", () => {
    expect(fillColumnWidths([origins, status], { origins: 200 }, 1000, 280)).toEqual({
      origins: 380,
      status: 340,
    });
  });

  it("columns wider than the room keep their own widths", () => {
    expect(fillColumnWidths([origins, status], { origins: 700 }, 1000, 280)).toEqual({
      origins: 700,
      status: 160,
    });
  });

  it("an unmeasured room leaves the widths as they are", () => {
    expect(fillColumnWidths([origins], { origins: 200 }, 0, 280)).toEqual({ origins: 200 });
  });
});

describe("getTagLabelMaxWidth", () => {
  it("a column at its estimated width keeps the default label width", () => {
    expect(getTagLabelMaxWidth(origins, 200, 2)).toBeUndefined();
  });

  it("a wide column splits its room between the tags it shows", () => {
    expect(getTagLabelMaxWidth(origins, 720, 2)).toBe(310);
  });

  it("an editable column keeps room for the suggester and the unlink buttons", () => {
    const editable = column("value", Explore.EExploreColumnType.EPV, true);
    expect(getTagLabelMaxWidth(editable, 720, 2)).toBe(231);
  });
});

const prop = (id: string, type: string, value: string, children: IProp[] = []): IProp =>
  ({ id, type: { entityId: type }, value: { entityId: value }, children }) as unknown as IProp;

describe("value column props", () => {
  const props = [
    prop("p1", "represents", "r1"),
    prop("p2", "represents", "r1"),
    prop("p3", "represents", "r2"),
    // the same value under another type, and as a subproperty
    prop("p4", "mentions", "r1", [prop("p5", "represents", "r1")]),
  ];

  it("finds a type and value pair among the top-level props", () => {
    expect(hasPropPair(props, "represents", "r1")).toBe(true);
    expect(hasPropPair(props, "represents", "r3")).toBe(false);
    expect(hasPropPair(props, "other", "r1")).toBe(false);
  });

  it("removes only the n-th top-level prop of the pair", () => {
    const ids = (occurrence: number) =>
      withoutNthPropPair(props, "represents", "r1", occurrence).map((p) => p.id);
    expect(ids(0)).toEqual(["p2", "p3", "p4"]);
    expect(ids(1)).toEqual(["p1", "p3", "p4"]);
    // no third prop of the pair, so nothing goes
    expect(ids(2)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(withoutNthPropPair(props, "represents", "r1", 0)[2].children).toHaveLength(1);
  });
});

describe("reference value column references", () => {
  const references: IReference[] = [
    { id: "f1", resource: "book", value: "page1" },
    { id: "f2", resource: "book", value: "page1" },
    { id: "f3", resource: "other", value: "page1" },
  ];

  it("finds a resource and value pair", () => {
    expect(hasReferencePair(references, "book", "page1")).toBe(true);
    expect(hasReferencePair(references, "book", "page2")).toBe(false);
  });

  it("removes every reference of the pair and nothing else", () => {
    expect(withoutReferencePair(references, "book", "page1").map((r) => r.id)).toEqual(["f3"]);
  });
});
