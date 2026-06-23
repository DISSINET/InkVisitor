import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity, IResponseTree } from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import {
  collectStatementAnchors,
  collectTerritoryAnchorsAtIndex,
  collectTerritoryChildren,
  getLeafTerritoryAnchorsAtIndex,
  computeDifferences,
  deepCopy,
  floorNumberToOneDecimal,
  getEntityLabel,
  getRelationTreeDepth,
  getShortLabelByLetterCount,
  isFirstLabelEmpty,
  isSafePassword,
  normalizeURL,
  searchTree,
} from "./utils";

test("isSafePassword should return true for a safe password", () => {
  const safePassword = "SafePassword123!";
  const result = isSafePassword(safePassword);
  expect(result).toBe(true);
});

test("isSafePassword should return false for a password shorter than 12 characters", () => {
  const shortPassword = "ShortPwd1!"; // Less than 12 characters
  const result = isSafePassword(shortPassword);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without an uppercase letter", () => {
  const passwordWithoutUppercase = "password123!"; // No uppercase letter
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without an lowercase letter", () => {
  const passwordWithoutUppercase = "PASSWORD123!"; // No lowercase letter
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without digits", () => {
  const passwordWithoutUppercase = "SafePassword!"; // No digits
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without symbols", () => {
  const passwordWithoutUppercase = "SafePassword123"; // No symbols
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

describe("isFirstLabelEmpty", () => {
  it("is true for empty labels or empty first label", () => {
    expect(isFirstLabelEmpty([])).toBe(true);
    expect(isFirstLabelEmpty([""])).toBe(true);
    expect(isFirstLabelEmpty(undefined as unknown as string[])).toBe(true);
  });
  it("is false when the first label has content", () => {
    expect(isFirstLabelEmpty(["label"])).toBe(false);
  });
});

describe("getEntityLabel", () => {
  const asEntity = (o: object) => o as unknown as IResponseEntity;

  it("returns the first label for non-statement entities", () => {
    expect(
      getEntityLabel(asEntity({ class: EntityEnums.Class.Person, labels: ["John"] }))
    ).toBe("John");
  });
  it('falls back to "no label" when no label is present', () => {
    expect(getEntityLabel(asEntity({ class: EntityEnums.Class.Person, labels: [] }))).toBe(
      "no label"
    );
    expect(getEntityLabel(undefined)).toBe("no label");
  });
  it("uses statement text when a statement has no label", () => {
    expect(
      getEntityLabel(
        asEntity({ class: EntityEnums.Class.Statement, labels: [], data: { text: "anchor text" } })
      )
    ).toBe("anchor text");
  });
});

describe("getShortLabelByLetterCount", () => {
  it("appends ellipsis when oversized", () => {
    expect(getShortLabelByLetterCount("abcdef", 3)).toBe("abc...");
  });
  it("returns the label unchanged when within limit", () => {
    expect(getShortLabelByLetterCount("abc", 3)).toBe("abc");
  });
});

describe("normalizeURL", () => {
  it("appends a trailing slash when missing", () => {
    expect(normalizeURL("http://x")).toBe("http://x/");
  });
  it("leaves an existing trailing slash intact", () => {
    expect(normalizeURL("http://x/")).toBe("http://x/");
  });
});

describe("floorNumberToOneDecimal", () => {
  it("floors to one decimal place", () => {
    expect(floorNumberToOneDecimal(1.26)).toBe(1.2);
    expect(floorNumberToOneDecimal(5)).toBe(5);
  });
});

describe("deepCopy", () => {
  it("clones nested structures without sharing references", () => {
    const original = { a: 1, nested: { b: [1, 2] } };
    const copy = deepCopy(original);
    expect(copy).toEqual(original);
    expect(copy.nested).not.toBe(original.nested);
    expect(copy.nested.b).not.toBe(original.nested.b);
  });
  it("returns primitives as-is", () => {
    expect(deepCopy(5)).toBe(5);
    expect(deepCopy(null)).toBe(null);
  });
});

describe("getRelationTreeDepth", () => {
  it("returns 1 for an empty tree", () => {
    expect(getRelationTreeDepth([])).toBe(1);
  });
  it("counts the deepest branch", () => {
    expect(
      getRelationTreeDepth([{ subtrees: [{ subtrees: [] }] }] as any)
    ).toBe(3);
  });
});

describe("computeDifferences", () => {
  it("returns only changed primitive fields", () => {
    expect(computeDifferences({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 3 });
  });
  it("returns nested diffs and changed arrays", () => {
    expect(
      computeDifferences(
        { data: { x: 1 }, list: [1] },
        { data: { x: 2 }, list: [1, 2] }
      )
    ).toEqual({ data: { x: 2 }, list: [1, 2] });
  });
  it("returns an empty object when nothing changed", () => {
    expect(computeDifferences({ a: 1 }, { a: 1 })).toEqual({});
  });
});

describe("searchTree", () => {
  const tree = {
    territory: { id: "root" },
    children: [
      { territory: { id: "child1" }, children: [] },
      { territory: { id: "child2" }, children: [] },
    ],
  } as unknown as IResponseTree;

  it("finds a node by id", () => {
    expect(searchTree(tree, "child2")?.territory.id).toBe("child2");
  });
  it("returns null when not found", () => {
    expect(searchTree(tree, "missing")).toBeNull();
  });
});

describe("collectTerritoryChildren", () => {
  it("collects all descendant territory ids", () => {
    const tree = {
      territory: { id: "root" },
      children: [
        {
          territory: { id: "a" },
          children: [{ territory: { id: "a1" }, children: [] }],
        },
        { territory: { id: "b" }, children: [] },
      ],
    } as unknown as IResponseTree;
    expect(collectTerritoryChildren(tree)).toEqual(["a", "b", "a1"]);
  });
});

describe("collectStatementAnchors", () => {
  it("collects nested anchors with the Statement class", () => {
    const anchors = [
      {
        anchor: "S1",
        class: EntityEnums.Class.Statement,
        children: [{ anchor: "P1", class: EntityEnums.Class.Person }],
      },
      {
        anchor: "T1",
        class: EntityEnums.Class.Territory,
        children: [{ anchor: "S2", class: EntityEnums.Class.Statement }],
      },
    ] as unknown as IAnchorsNode[];
    expect(collectStatementAnchors(anchors).map((a) => a.anchor)).toEqual([
      "S1",
      "S2",
    ]);
  });
});

// nested + overlapping Territory anchors sharing one full-text
const territoryAnchorTree = [
  {
    anchor: "Touter",
    class: EntityEnums.Class.Territory,
    indexStart: 0,
    indexEnd: 100,
    children: [
      {
        anchor: "Tinner",
        class: EntityEnums.Class.Territory,
        indexStart: 10,
        indexEnd: 50,
        children: [
          { anchor: "S1", class: EntityEnums.Class.Statement, indexStart: 20, indexEnd: 25 },
        ],
      },
    ],
  },
  {
    anchor: "Tother",
    class: EntityEnums.Class.Territory,
    indexStart: 40,
    indexEnd: 120,
    children: [],
  },
] as unknown as IAnchorsNode[];

describe("collectTerritoryAnchorsAtIndex", () => {
  it("collects all Territory anchors whose span contains the index", () => {
    expect(
      collectTerritoryAnchorsAtIndex(territoryAnchorTree, 45)
        .map((a) => a.anchor)
        .sort()
    ).toEqual(["Tinner", "Tother", "Touter"]);
  });

  it("ignores non-Territory anchors", () => {
    expect(
      collectTerritoryAnchorsAtIndex(territoryAnchorTree, 22).map((a) => a.anchor)
    ).not.toContain("S1");
  });

  it("returns only the outer T when index is outside inner/other spans", () => {
    expect(
      collectTerritoryAnchorsAtIndex(territoryAnchorTree, 5).map((a) => a.anchor)
    ).toEqual(["Touter"]);
  });

  it("returns empty when index is in no Territory span", () => {
    expect(collectTerritoryAnchorsAtIndex(territoryAnchorTree, 200)).toEqual([]);
  });

  it("treats span bounds as inclusive", () => {
    expect(
      collectTerritoryAnchorsAtIndex(territoryAnchorTree, 100).map((a) => a.anchor)
    ).toContain("Touter");
  });
});

describe("getLeafTerritoryAnchorsAtIndex", () => {
  it("drops Ts that contain another candidate, keeping leaves, deepest (smallest span) first", () => {
    expect(
      getLeafTerritoryAnchorsAtIndex(territoryAnchorTree, 45).map((a) => a.anchor)
    ).toEqual(["Tinner", "Tother"]);
  });

  it("returns the single containing T when no nesting applies", () => {
    expect(
      getLeafTerritoryAnchorsAtIndex(territoryAnchorTree, 5).map((a) => a.anchor)
    ).toEqual(["Touter"]);
  });

  it("returns empty when index is in no Territory span", () => {
    expect(getLeafTerritoryAnchorsAtIndex(territoryAnchorTree, 200)).toEqual([]);
  });

  it("breaks span ties by larger indexStart first", () => {
    const tied = [
      { anchor: "Ta", class: EntityEnums.Class.Territory, indexStart: 0, indexEnd: 10, children: [] },
      { anchor: "Tb", class: EntityEnums.Class.Territory, indexStart: 3, indexEnd: 13, children: [] },
    ] as unknown as IAnchorsNode[];
    expect(getLeafTerritoryAnchorsAtIndex(tied, 5).map((a) => a.anchor)).toEqual([
      "Tb",
      "Ta",
    ]);
  });
});
