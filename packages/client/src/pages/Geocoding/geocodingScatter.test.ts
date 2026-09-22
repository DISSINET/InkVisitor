import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { Suggestion } from "./engineTypes";
import { __testing } from "./GeocodingSuggestions";

const {
  scatterOf,
  spreadIsMeasured,
  spreadWarningKm,
  DEFAULT_MERGE_RADIUS_KM,
  SPREAD_WARNING_FRACTION,
} = __testing;

/**
 * `spreadKm` is the median distance between the matches behind one suggestion,
 * so the match count is what decides whether the number means anything at all.
 *
 * How far that number may run before the group stops being one place is the
 * engine's `mergeRadiusKm`, which is derived from the place type: 7.5 km for a
 * church, 25 km for a settlement, 150 km for a region.
 */
const suggestion = (spreadKm: number, matchCount: number): Suggestion =>
  ({ spreadKm, matches: Array.from({ length: matchCount }, () => ({})) }) as Suggestion;

const SETTLEMENT = 25;
const CHURCH = 7.5;

describe("spreadIsMeasured", () => {
  it("is false for a single match, where the engine reports zero for want of a pair", () => {
    expect(spreadIsMeasured(suggestion(0, 1))).toBe(false);
  });

  it("is true for two matches that happen to sit on the same point", () => {
    expect(spreadIsMeasured(suggestion(0, 2))).toBe(true);
  });
});

describe("spreadWarningKm", () => {
  it("gives back the 15 km the sample was calibrated on for a settlement", () => {
    expect(spreadWarningKm(SETTLEMENT)).toBe(15);
  });

  it("scales down with the radius, so a church is judged on its own scale", () => {
    expect(spreadWarningKm(CHURCH)).toBe(4.5);
  });

  it("falls back to a ten kilometre radius where the engine published none", () => {
    // the preview frame carries no radius, and an older engine carries none at
    // all; ten is below every radius the engine uses but a church's and a
    // fortress's, so the fallback errs towards flagging
    expect(DEFAULT_MERGE_RADIUS_KM).toBe(10);
    expect(spreadWarningKm(undefined)).toBe(6);
  });

  it("stays inside the merge radius, so it can fire at all", () => {
    expect(SPREAD_WARNING_FRACTION).toBeLessThan(1);
  });
});

describe("scatterOf", () => {
  it("does not call a single match scattered, whatever its spread reads as", () => {
    // one match at 30 km would otherwise be flagged on a number that was never
    // measured, and the sole match is the tightest evidence there is
    expect(scatterOf(suggestion(30, 1), SETTLEMENT).scattered).toBe(false);
  });

  it("leads with precise while the matches agree", () => {
    expect(scatterOf(suggestion(2, 6), SETTLEMENT).leadAccuracy).toBe(GeocodingAccuracy.Precise);
  });

  it("leads with approximate once the matches are scattered", () => {
    const result = scatterOf(suggestion(15, 4), SETTLEMENT);
    expect(result.scattered).toBe(true);
    expect(result.leadAccuracy).toBe(GeocodingAccuracy.Approximate);
  });

  it("treats the threshold itself as scattered and the step below it as not", () => {
    expect(scatterOf(suggestion(14.9, 4), SETTLEMENT).scattered).toBe(false);
    expect(scatterOf(suggestion(15, 4), SETTLEMENT).scattered).toBe(true);
  });

  it("flags a church at a spread a settlement would carry without comment", () => {
    // 5 km across a church's matches is two different buildings; across a
    // settlement's it is one town's outskirts
    expect(scatterOf(suggestion(5, 4), CHURCH).scattered).toBe(true);
    expect(scatterOf(suggestion(5, 4), SETTLEMENT).scattered).toBe(false);
  });

  it("judges against the fallback radius where the engine published none", () => {
    expect(scatterOf(suggestion(100, 4), undefined).scattered).toBe(true);
    expect(scatterOf(suggestion(6, 4), undefined).scattered).toBe(true);
    expect(scatterOf(suggestion(5.9, 4), undefined).scattered).toBe(false);
  });

  it("still calls a single match unscattered under the fallback", () => {
    // the fallback changes what the number is measured against, not whether the
    // number was measured at all
    expect(scatterOf(suggestion(100, 1), undefined).scattered).toBe(false);
  });
});
