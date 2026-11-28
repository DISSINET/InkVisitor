import { describe, expect, it } from "vitest";
import type { EngineSuggester } from "../../types/engine";
import {
  OFTEN_FAILS_FROM,
  QUICK_BELOW_MS,
  SLOW_FROM_MS,
  formatCount,
  itemsOf,
  oftenFails,
  scopeLine,
  speedOf,
} from "./gazetteerFacts";

const suggester = (over: Partial<EngineSuggester> & { info?: EngineSuggester["info"] } = {}): EngineSuggester => ({
  name: "wikidata",
  category: "service",
  coverage: {},
  health: { status: "ready" },
  weight: { default: 0.85, min: 0.5 },
  footprint: null,
  info: { description: "Structured data on anything with a coordinate. Uneven for the medieval." },
  ...over,
});

const latency = (over: Partial<NonNullable<EngineSuggester["latency"]>> = {}) => ({
  samples: 40,
  p50Ms: 2000,
  p95Ms: 6000,
  failures: 0,
  meanCandidates: 3.4,
  ...over,
});

describe("scopeLine", () => {
  it("joins time, geography and topic when the engine published them", () => {
    expect(
      scopeLine(
        suggester({
          info: { scope: { time: "1250–1450", geography: "Latin Christendom", topic: "dioceses" } },
        }),
      ),
    ).toBe("1250–1450 · Latin Christendom · dioceses");
  });

  it("falls back to the first sentence of the description when the engine published no scope", () => {
    expect(scopeLine(suggester())).toBe("Structured data on anything with a coordinate");
  });

  it("is nothing when there is neither", () => {
    expect(scopeLine(suggester({ info: {} }))).toBeNull();
  });
});

describe("speedOf", () => {
  it("calls a local file local, without needing a measurement", () => {
    expect(speedOf(suggester({ category: "file" }))?.level).toBe("local");
  });

  it("says nothing for a service the engine has not measured, rather than guessing", () => {
    expect(speedOf(suggester({ latency: null }))).toBeNull();
    expect(speedOf(suggester({}))).toBeNull();
  });

  it.each([
    [QUICK_BELOW_MS - 1, "quick"],
    [QUICK_BELOW_MS, "moderate"],
    [SLOW_FROM_MS - 1, "moderate"],
    [SLOW_FROM_MS, "slow"],
  ])("a median of %i ms is %s", (p50Ms, level) => {
    expect(speedOf(suggester({ latency: latency({ p50Ms }) }))?.level).toBe(level);
  });

  it("puts the median in the label and the spread in the sentence", () => {
    const speed = speedOf(suggester({ latency: latency({ p50Ms: 4800, p95Ms: 12000 }) }));
    expect(speed?.label).toBe("slow · 4.8 s");
    expect(speed?.sentence).toContain("12 s");
    expect(speed?.sentence).toContain("40 runs");
  });
});

describe("oftenFails", () => {
  it("is nothing for a source that rarely fails or has not failed", () => {
    expect(oftenFails(suggester({ latency: latency({ failures: 0 }) }))).toBeNull();
    expect(oftenFails(suggester({ latency: latency({ samples: 95, failures: 5 }) }))).toBeNull();
    expect(oftenFails(suggester({ latency: null }))).toBeNull();
  });

  it("counts failures against every run that reached the source, not only the timed ones", () => {
    // 10 failures over 40 timed runs is 10 of 50, which is exactly the threshold
    const fails = oftenFails(suggester({ latency: latency({ samples: 40, failures: 10 }) }));
    expect(fails?.share).toBe(OFTEN_FAILS_FROM);
    expect(fails?.sentence).toContain("10 of its last 50");
  });
});

describe("formatCount", () => {
  it.each([
    [2303, "2,303"],
    [621528, "621,528"],
    [3020110, "3.0 M"],
    [13000000, "13 M"],
  ])("%i is %s", (count, text) => {
    expect(formatCount(count)).toBe(text);
  });
});

describe("itemsOf", () => {
  it("marks an approximate count and adds the date it is as of to the sentence", () => {
    const items = itemsOf(
      suggester({
        info: { size: { records: 13000000, approximate: true, asOf: "2026-11-05", what: "Unique features" } },
      }),
    );
    expect(items?.label).toBe("≈ 13 M records");
    expect(items?.sentence).toBe("Unique features (as of 2026-11-05)");
  });

  it("is nothing where nobody publishes a count, and does not fall back to a footprint it was told to ignore", () => {
    expect(
      itemsOf(
        suggester({
          footprint: { records: 5, cells: 1 },
          info: { size: { records: null, approximate: true, what: "No count is published" } },
        }),
      ),
    ).toBeNull();
  });

  it("falls back to the located records of an engine that publishes no size", () => {
    expect(itemsOf(suggester({ category: "file", footprint: { records: 11766, cells: 262 } }))?.label).toBe(
      "11,766 located records",
    );
    expect(itemsOf(suggester())).toBeNull();
  });
});
