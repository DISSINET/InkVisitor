import { describe, expect, it } from "vitest";
import {
  isSearchTermInRange,
  MAX_SEARCH_TERM_LENGTH,
  MIN_SEARCH_TERM_LENGTH,
} from "./useAnnotatorSearch";

describe("isSearchTermInRange", () => {
  it("runs terms from the minimum to the maximum length", () => {
    expect(isSearchTermInRange("a".repeat(MIN_SEARCH_TERM_LENGTH))).toBe(true);
    expect(isSearchTermInRange("a".repeat(MAX_SEARCH_TERM_LENGTH))).toBe(true);
  });

  it("skips a term shorter than the minimum", () => {
    expect(isSearchTermInRange("a".repeat(MIN_SEARCH_TERM_LENGTH - 1))).toBe(false);
  });

  it("skips a term longer than the maximum, such as a whole selected document", () => {
    expect(isSearchTermInRange("a".repeat(MAX_SEARCH_TERM_LENGTH + 1))).toBe(false);
  });

  it("keeps the maximum well inside what a regular expression can compile", () => {
    // every search escapes the term into one RegExp, the whole-word modes wrap
    // it in lookarounds; the worst case at the cap must still compile
    const escaped = "(".repeat(MAX_SEARCH_TERM_LENGTH).replace(/[(]/g, "\\(");
    expect(() => new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "giu")).not.toThrow();
  });
});
