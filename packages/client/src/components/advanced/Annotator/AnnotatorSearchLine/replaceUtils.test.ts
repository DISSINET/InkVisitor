import { describe, expect, it } from "vitest";
import {
  applyReplacements,
  clampActiveOccurenceIndex,
  nextOccurenceIndexAfter,
} from "./replaceUtils";

describe("applyReplacements", () => {
  it("replaces a single range", () => {
    expect(applyReplacements("abc def", [{ startIndex: 4, endIndex: 7 }], "xyz")).toBe("abc xyz");
  });

  it("replaces several ranges regardless of input order", () => {
    const text = "sad man sad";
    const ranges = [
      { startIndex: 0, endIndex: 3 },
      { startIndex: 8, endIndex: 11 },
    ];
    expect(applyReplacements(text, ranges, "asd")).toBe("asd man asd");
    expect(applyReplacements(text, [...ranges].reverse(), "asd")).toBe("asd man asd");
  });

  it("handles a replacement longer than the replaced text without shifting later ranges", () => {
    const text = "a a a";
    const ranges = [
      { startIndex: 0, endIndex: 1 },
      { startIndex: 2, endIndex: 3 },
      { startIndex: 4, endIndex: 5 },
    ];
    expect(applyReplacements(text, ranges, "bbb")).toBe("bbb bbb bbb");
  });

  it("skips ranges that are out of bounds or inverted", () => {
    const text = "abc";
    const ranges = [
      { startIndex: -1, endIndex: 2 },
      { startIndex: 2, endIndex: 1 },
      { startIndex: 1, endIndex: 99 },
    ];
    expect(applyReplacements(text, ranges, "X")).toBe("abc");
  });

  it("returns the text unchanged for an empty range list", () => {
    expect(applyReplacements("abc", [], "X")).toBe("abc");
  });
});

describe("clampActiveOccurenceIndex", () => {
  it("keeps an index the list still addresses", () => {
    expect(clampActiveOccurenceIndex(0, 2)).toBe(0);
    expect(clampActiveOccurenceIndex(1, 2)).toBe(1);
  });

  it("pulls an index past the end back to the last occurrence", () => {
    expect(clampActiveOccurenceIndex(5, 2)).toBe(1);
  });

  it("returns 0 for an empty list", () => {
    expect(clampActiveOccurenceIndex(3, 0)).toBe(0);
  });
});

describe("nextOccurenceIndexAfter", () => {
  it("steps over a replacement that still matches the term", () => {
    // "bal" at 0, 10, 20; the one at 10 was replaced by a 3-char match
    expect(nextOccurenceIndexAfter([0, 10, 20], 13)).toBe(2);
  });

  it("lands on the following match when the replacement no longer matches", () => {
    // the match at 10 is gone, so the list is [0, 20]
    expect(nextOccurenceIndexAfter([0, 20], 13)).toBe(1);
  });

  it("skips matches created inside the replacement", () => {
    // "bal" replaced by "balbal": new matches at 10 and 13, resume past both
    expect(nextOccurenceIndexAfter([0, 10, 13, 20], 16)).toBe(3);
  });

  it("wraps to the first occurrence when the replaced spot was last", () => {
    expect(nextOccurenceIndexAfter([0, 10], 23)).toBe(0);
  });

  it("returns 0 for an empty list", () => {
    expect(nextOccurenceIndexAfter([], 13)).toBe(0);
  });
});
