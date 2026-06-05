import { describe, it, expect } from "vitest";
import {
  applyPasteToDraft,
  computeWindowUpdate,
  mergeTokensIntoIds,
  unparsedRemainder,
} from "./utils";

describe("computeWindowUpdate", () => {
  const base = {
    viewportHeight: 400,
    rowHeight: 30,
    overscan: 10,
    minDelta: 5,
  };

  it("expands a 1-row window to cover a small result set (limit:1, total:2)", () => {
    // The bug: adding a 2nd uuid → total 2 but limit stuck at 1, only 1 row loads.
    const r = computeWindowUpdate({
      ...base,
      visibleStart: 0,
      visibleEnd: 1,
      total: 2,
      currentOffset: 0,
      currentLimit: 1,
      loadedOffset: 0,
      loadedCount: 1,
    });
    expect(r.shouldUpdate).toBe(true);
    expect(r.offset).toBe(0);
    expect(r.limit).toBe(2);
  });

  it("does not refetch once the small window already covers all rows", () => {
    const r = computeWindowUpdate({
      ...base,
      visibleStart: 0,
      visibleEnd: 1,
      total: 2,
      currentOffset: 0,
      currentLimit: 2,
      loadedOffset: 0,
      loadedCount: 2,
    });
    expect(r.shouldUpdate).toBe(false);
  });

  it("refetches a new window when scrolling past the loaded range", () => {
    const r = computeWindowUpdate({
      ...base,
      viewportHeight: 600,
      visibleStart: 100,
      visibleEnd: 120,
      total: 1000,
      currentOffset: 0,
      currentLimit: 30,
      loadedOffset: 0,
      loadedCount: 30,
    });
    expect(r.shouldUpdate).toBe(true);
    expect(r.offset).toBe(90); // visibleStart - overscan
  });

  it("is a no-op when total is zero", () => {
    const r = computeWindowUpdate({
      ...base,
      visibleStart: 0,
      visibleEnd: 0,
      total: 0,
      currentOffset: 0,
      currentLimit: 1,
      loadedOffset: 0,
      loadedCount: 0,
    });
    expect(r.shouldUpdate).toBe(false);
  });
});

describe("mergeTokensIntoIds", () => {
  const ID1 = "000033c5-472f-49a8-8d75-d82f955cce0b";
  const ID2 = "a1b2c3d4-5678-41a8-9d75-d82f955cce0b";
  const ID3 = "ffffffff-1111-2222-8888-cccccccccccc";

  it("adds a single valid uuid to an empty list", () => {
    expect(mergeTokensIntoIds([], ID1)).toEqual([ID1]);
  });

  it("returns the existing ids unchanged when the text has no valid uuid", () => {
    expect(mergeTokensIntoIds([ID1], "foo bar not-a-uuid")).toEqual([ID1]);
  });

  it("appends several pasted uuids preserving paste order after existing ids", () => {
    expect(mergeTokensIntoIds([ID1], `${ID2}, ${ID3}`)).toEqual([ID1, ID2, ID3]);
  });

  it("ignores a uuid already present, case-insensitively", () => {
    expect(mergeTokensIntoIds([ID1], ID1.toUpperCase())).toEqual([ID1]);
  });

  it("dedups repeated uuids within the same pasted text", () => {
    expect(mergeTokensIntoIds([], `${ID2} ${ID2}`)).toEqual([ID2]);
  });

  it("drops invalid tokens but keeps the valid ones from the same paste", () => {
    expect(mergeTokensIntoIds([], `foo ${ID1} 12345 ${ID2}`)).toEqual([ID1, ID2]);
  });
});

describe("unparsedRemainder", () => {
  const ID1 = "000033c5-472f-49a8-8d75-d82f955cce0b";
  const ID2 = "a1b2c3d4-5678-41a8-9d75-d82f955cce0b";

  it("returns empty string for empty or whitespace-only input", () => {
    expect(unparsedRemainder("")).toBe("");
    expect(unparsedRemainder("   ")).toBe("");
  });

  it("returns empty string when the text is exactly one valid uuid", () => {
    expect(unparsedRemainder(ID1)).toBe("");
  });

  it("returns empty string when every token is a valid uuid", () => {
    expect(unparsedRemainder(`${ID1} ${ID2}`)).toBe("");
  });

  it("keeps a partially-typed (invalid) uuid", () => {
    expect(unparsedRemainder("000033c5-472f")).toBe("000033c5-472f");
  });

  it("keeps non-uuid words and drops the extracted valid uuid", () => {
    expect(unparsedRemainder(`foo ${ID1} bar`)).toBe("foo bar");
  });

  it("keeps the leftover junk after extracting a pasted uuid", () => {
    expect(unparsedRemainder(`${ID1}, garbage`)).toBe("garbage");
  });
});

describe("applyPasteToDraft", () => {
  const UUID = "000033c5-472f-49a8-8d75-d82f955cce0b";

  it("replaces the whole draft when everything is selected", () => {
    // Bug: select-all + paste must replace, not append. "d2e3232sdsd" is 11 chars.
    expect(applyPasteToDraft("d2e3232sdsd", 0, 11, UUID)).toBe(UUID);
  });

  it("inserts at the cursor when nothing is selected", () => {
    expect(applyPasteToDraft("abc", 3, 3, "X")).toBe("abcX");
  });

  it("replaces only the selected range", () => {
    expect(applyPasteToDraft("hello world", 0, 5, "bye")).toBe("bye world");
  });
});
