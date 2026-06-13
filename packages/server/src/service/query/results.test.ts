import "ts-jest";
import Results from "./results";

describe("Results.orderByIds", () => {
  const make = (items: string[] | null): Results<{ id: string }> => {
    const r = new Results<{ id: string }>();
    r.items = items;
    return r;
  };

  it("reorders items to match the input id order", () => {
    const r = make(["b", "a", "c"]);
    r.orderByIds(["c", "a", "b"]);
    expect(r.items).toEqual(["c", "a", "b"]);
  });

  it("drops input ids that are absent from items", () => {
    const r = make(["a", "b"]);
    r.orderByIds(["b", "x", "a"]);
    expect(r.items).toEqual(["b", "a"]);
  });

  it("matches case-insensitively, preserving item casing", () => {
    const r = make(["A1B2", "c3d4"]);
    r.orderByIds(["c3d4", "a1b2"]);
    expect(r.items).toEqual(["c3d4", "A1B2"]);
  });

  it("deduplicates repeated input ids", () => {
    const r = make(["a", "b"]);
    r.orderByIds(["b", "b", "a"]);
    expect(r.items).toEqual(["b", "a"]);
  });

  it("appends items missing from the input id list last, in original order", () => {
    const r = make(["a", "b", "c"]);
    r.orderByIds(["c"]);
    expect(r.items).toEqual(["c", "a", "b"]);
  });

  it("is a no-op for empty or null items", () => {
    const empty = make([]);
    empty.orderByIds(["a"]);
    expect(empty.items).toEqual([]);

    const nul = make(null);
    nul.orderByIds(["a"]);
    expect(nul.items).toBeNull();
  });
});
