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
});
