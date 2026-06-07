import { describe, it, expect } from "vitest";
import { computeWindowUpdate } from "./utils";

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
