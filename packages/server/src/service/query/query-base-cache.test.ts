import "ts-jest";
import { Query } from "@inkvisitor/shared/types/query";
import {
  clearQueryBaseCache,
  getCachedBaseIds,
  queryCacheKey,
  setCachedBaseIds,
} from "./query-base-cache";

describe("query-base-cache", () => {
  beforeEach(() => {
    clearQueryBaseCache();
  });

  const sampleQuery = { id: "root", params: { label: "test" } } as unknown as Query.INode;

  it("returns cached ids for the same query key", () => {
    const key = queryCacheKey(sampleQuery);
    setCachedBaseIds(key, ["a", "b"]);
    expect(getCachedBaseIds(key)).toEqual(["a", "b"]);
  });

  it("returns a copy so mutations do not affect the cache", () => {
    const key = queryCacheKey(sampleQuery);
    setCachedBaseIds(key, ["a"]);
    const cached = getCachedBaseIds(key)!;
    cached.push("b");
    expect(getCachedBaseIds(key)).toEqual(["a"]);
  });
});
