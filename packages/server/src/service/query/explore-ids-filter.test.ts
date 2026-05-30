import "ts-jest";
import { Explore } from "@inkvisitor/shared/types/query";
import { applyRowIdsFilter, getRowIdsFilter } from "./explore-ids-filter";

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
    expect(applyRowIdsFilter(items, rowIdsFilter(["b", "d", "x"]))).toEqual(["b", "d"]);
    expect(applyRowIdsFilter(items, rowIdsFilter([]))).toEqual(items);
  });
});
