import { describe, expect, it } from "vitest";
import { applyReplacements, nextActiveOccurenceIndex } from "./replaceUtils";

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

describe("nextActiveOccurenceIndex", () => {
  it("keeps the index when occurrences remain after it", () => {
    expect(nextActiveOccurenceIndex(0, 2)).toBe(0);
  });

  it("steps back when the removed occurrence was the last one", () => {
    expect(nextActiveOccurenceIndex(2, 2)).toBe(1);
  });

  it("resets to 0 when nothing is left", () => {
    expect(nextActiveOccurenceIndex(3, 0)).toBe(0);
  });
});
