import "ts-jest";
import { Explore } from "@inkvisitor/shared/types/query";
import {
  entityIdsEqual,
  parseEntityIdsFromText,
} from "@inkvisitor/shared/utils/parse-entity-ids";
import { applyRowIdsFilter, getRowIdsFilter } from "./explore-ids-filter";

describe("parseEntityIdsFromText", () => {
  const id1 = "4ce5e669-d421-40c9-b1ce-f476fdd171fe";
  const id2 = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

  it("parses space-separated UUIDs", () => {
    expect(parseEntityIdsFromText(`${id1} ${id2}`)).toEqual([id1, id2]);
  });

  it("parses tab, newline, and comma separators", () => {
    expect(parseEntityIdsFromText(`${id1}\t${id2}`)).toEqual([id1, id2]);
    expect(parseEntityIdsFromText(`${id1}\n${id2}`)).toEqual([id1, id2]);
    expect(parseEntityIdsFromText(`${id1},${id2}`)).toEqual([id1, id2]);
  });

  it("deduplicates and ignores invalid tokens", () => {
    expect(parseEntityIdsFromText(`${id1} ${id1} not-a-uuid ${id2}`)).toEqual([
      id1,
      id2,
    ]);
  });

  it("returns empty array for empty or invalid-only input", () => {
    expect(parseEntityIdsFromText("")).toEqual([]);
    expect(parseEntityIdsFromText("   \n\t  ")).toEqual([]);
    expect(parseEntityIdsFromText("foo bar")).toEqual([]);
  });
});

describe("entityIdsEqual", () => {
  it("compares ids case-insensitively", () => {
    expect(
      entityIdsEqual(
        ["4ce5e669-d421-40c9-b1ce-f476fdd171fe"],
        ["4CE5E669-D421-40C9-B1CE-F476FDD171FE"]
      )
    ).toBeTruthy();
  });
});

describe("explore-ids-filter", () => {
  const rowIdsFilter = (ids: string[]): Explore.IExploreRowIdsFilter => ({
    type: Explore.EExploreFilterType.RowIds,
    ids,
  });

  it("getRowIdsFilter finds row ids filter", () => {
    const filter = rowIdsFilter(["a"]);
    expect(getRowIdsFilter([filter])).toEqual(filter);
    expect(getRowIdsFilter([])).toBeUndefined();
  });

  it("applyRowIdsFilter intersects with allowed ids", () => {
    const items = ["a", "b", "c", "d"];
    expect(applyRowIdsFilter(items, rowIdsFilter(["b", "d", "x"]))).toEqual([
      "b",
      "d",
    ]);
    expect(applyRowIdsFilter(items, rowIdsFilter([]))).toEqual(items);
  });
});
