import { describe, expect, it } from "vitest";
import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { SuggestRequest } from "../../types/engine";
import { ENGINE_LIMITS, tooLargeReason, withinListLimits } from "./engineLimits";
import { buildSuggestQuery } from "./suggestQuery";

describe("what the engine refuses for size", () => {
  it("refuses a name past the limit and says by how much it was over", () => {
    const long = { name: "x".repeat(ENGINE_LIMITS.name + 1) } as SuggestRequest;
    expect(tooLargeReason(long)).toContain(`${ENGINE_LIMITS.name + 1} characters`);
    expect(tooLargeReason({ name: "x".repeat(ENGINE_LIMITS.name) } as SuggestRequest)).toBeNull();
  });

  it("keeps the first ten entries of a list and drops one that is too long", () => {
    const many = Array.from({ length: 14 }, (_, i) => `value-${i}`);
    expect(withinListLimits(many)).toEqual(many.slice(0, ENGINE_LIMITS.listEntries));
    expect(withinListLimits(["ok", "y".repeat(ENGINE_LIMITS.listEntryLength + 1)])).toEqual(["ok"]);
  });

  it("leaves an emptied list off the request rather than sending it empty", () => {
    expect(withinListLimits([])).toBeUndefined();
    expect(withinListLimits(["y".repeat(101)])).toBeUndefined();
  });

  it("holds a context saved with more than ten values to ten on the request", () => {
    const context = {
      regions: Array.from({ length: 12 }, (_, i) => `r${i}`),
      periods: Array.from({ length: 12 }, (_, i) => `${1000 + i}`),
      languages: ["de"],
      placeTypes: [],
    } as unknown as IGeocodingContext;
    const query = buildSuggestQuery("Breslau", context);
    for (const field of ["region", "period"] as const) {
      expect(query[field]?.length ?? 0).toBeLessThanOrEqual(ENGINE_LIMITS.listEntries);
    }
  });
});
