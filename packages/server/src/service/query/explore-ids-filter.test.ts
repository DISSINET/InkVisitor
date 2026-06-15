import "ts-jest";
import { Explore } from "@inkvisitor/shared/types/query";
import { applyRowIdsFilter, getRowIdsFilter } from "./explore-ids-filter";

describe("explore-ids-filter", () => {
  const rowIdsFilter = (ids: string[]): Explore.IExploreUuidsFilter => ({
    type: Explore.SearchOption.UUIDs,
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

  it("applyRowIdsFilter matches case-insensitively, preserving item casing", () => {
    // DB ids are lowercase; user-pasted filter ids may be mixed/upper case
    const items = ["a1b2", "c3d4", "e5f6"];
    expect(applyRowIdsFilter(items, rowIdsFilter(["C3D4", "A1B2", "x"]))).toEqual([
      "a1b2",
      "c3d4",
    ]);
  });
});
