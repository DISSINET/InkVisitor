import "ts-jest";
import {
  startOfDay,
  getLiveTailRange,
  mergeStatsValues,
} from "./hybrid-stats";

describe("startOfDay", () => {
  test("zeroes the time component, keeps the calendar day", () => {
    const result = startOfDay(new Date(2026, 4, 21, 14, 30, 5, 123));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(21);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe("getLiveTailRange", () => {
  const now = new Date(2026, 4, 21, 14, 30);
  const todayStart = startOfDay(now).getTime();

  test("returns today's window when the range ends now", () => {
    const from = new Date(2000, 0, 1).getTime();
    expect(getLiveTailRange(from, now.getTime(), now)).toEqual({
      fromDate: todayStart,
      toDate: now.getTime(),
    });
  });

  test("returns null when the range ends before today", () => {
    const from = new Date(2000, 0, 1).getTime();
    const endOfYesterday = todayStart - 1;
    expect(getLiveTailRange(from, endOfYesterday, now)).toBeNull();
  });

  test("clamps the live start to the range start when the range begins within today", () => {
    const oneAmToday = todayStart + 60 * 60 * 1000;
    expect(getLiveTailRange(oneAmToday, now.getTime(), now)).toEqual({
      fromDate: oneAmToday,
      toDate: now.getTime(),
    });
  });

  test("returns null when toDate equals today's start (nothing of today in range)", () => {
    const from = new Date(2000, 0, 1).getTime();
    expect(getLiveTailRange(from, todayStart, now)).toBeNull();
  });
});

describe("mergeStatsValues", () => {
  test("sums counts for overlapping bucket/key and keeps the rest", () => {
    const base = { "2026": { edit: 100, create: 5 } };
    const addition = { "2026": { edit: 3, anchor_add: 2 } };
    expect(mergeStatsValues(base, addition)).toEqual({
      "2026": { edit: 103, create: 5, anchor_add: 2 },
    });
  });

  test("adds buckets that exist only in the addition", () => {
    const base = { "2025": { edit: 10 } };
    const addition = { "2026": { edit: 1 } };
    expect(mergeStatsValues(base, addition)).toEqual({
      "2025": { edit: 10 },
      "2026": { edit: 1 },
    });
  });

  test("does not mutate the base", () => {
    const base = { "2026": { edit: 100 } };
    mergeStatsValues(base, { "2026": { edit: 3 } });
    expect(base).toEqual({ "2026": { edit: 100 } });
  });
});
