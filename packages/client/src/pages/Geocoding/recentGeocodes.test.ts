import { describe, expect, it } from "vitest";
import { addRecent, agoLabel, RECENT_LIMIT, readRecent, RecentGeocode } from "./recentGeocodes";

const entry = (id: string, at = 1): RecentGeocode => ({
  id,
  label: `place ${id}`,
  lat: 50,
  lon: 15,
  kind: "Point",
  accuracy: "precise",
  at,
});

describe("addRecent", () => {
  it("puts the newest entry first", () => {
    expect(addRecent([entry("a")], entry("b")).map((one) => one.id)).toEqual(["b", "a"]);
  });

  it("keeps a Location once, at its latest write", () => {
    const list = addRecent([entry("a", 1), entry("b", 2)], entry("a", 3));
    expect(list.map((one) => one.id)).toEqual(["a", "b"]);
    expect(list[0].at).toBe(3);
  });

  it("drops the oldest entries past the limit", () => {
    let list: RecentGeocode[] = [];
    for (let index = 0; index < RECENT_LIMIT + 3; index++) {
      list = addRecent(list, entry(String(index)));
    }
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0].id).toBe(String(RECENT_LIMIT + 2));
    expect(list.some((one) => one.id === "0")).toBe(false);
  });
});

describe("readRecent", () => {
  it("is empty where nothing is stored or the value is unreadable", () => {
    expect(readRecent(null)).toEqual([]);
    expect(readRecent("{nope")).toEqual([]);
    expect(readRecent('{"id":"a"}')).toEqual([]);
  });

  it("keeps the entries that are whole and drops the ones that are not", () => {
    const stored = JSON.stringify([
      entry("a"),
      { id: "b", label: "no coordinate" },
      { ...entry("c"), lat: "50" },
      { ...entry("d"), lon: null },
      entry("e"),
    ]);
    expect(readRecent(stored).map((one) => one.id)).toEqual(["a", "e"]);
  });
});

describe("readRecent suggestion", () => {
  const suggestion = {
    label: "Prato",
    lat: 43.9,
    lon: 11.1,
    score: 0.5,
    spreadKm: 0,
    offRegion: false,
    matches: [],
    signals: {
      agreement: 1,
      evidence: 1,
      contextGate: 1,
      candidatePrior: 1,
      offRegionFactor: 1,
      convergence: 1,
      matchScore: 1,
      candidateDiversity: 1,
    },
  };

  it("keeps a whole suggestion and drops one the card could not read, keeping the entry", () => {
    const stored = JSON.stringify([
      { ...entry("a"), suggestion },
      { ...entry("b"), suggestion: { label: "Prato", lat: 1 } },
      { ...entry("c"), suggestion: { ...suggestion, signals: { agreement: 1 } } },
    ]);
    const list = readRecent(stored);
    expect(list.map((one) => one.id)).toEqual(["a", "b", "c"]);
    expect(list[0].suggestion?.label).toBe("Prato");
    expect(list[1].suggestion).toBeUndefined();
    expect(list[2].suggestion).toBeUndefined();
  });
});

describe("agoLabel", () => {
  const now = 10_000_000;
  it("uses the coarsest unit that is still true", () => {
    expect(agoLabel(now - 3_000, now)).toBe("just now");
    expect(agoLabel(now - 42_000, now)).toBe("42 s ago");
    expect(agoLabel(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(agoLabel(now - 3 * 3_600_000, now)).toBe("3 h ago");
    expect(agoLabel(now - 2 * 86_400_000, now)).toBe("2 d ago");
  });

  it("never reads a clock set ahead of the entry as negative", () => {
    expect(agoLabel(now + 60_000, now)).toBe("just now");
  });
});
