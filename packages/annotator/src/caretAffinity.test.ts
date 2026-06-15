/**
 * Phase 3.2 — affinity-aware offset<->visual converters.
 *
 * At a soft-wrap boundary one document offset maps to two visual caret
 * positions; the affinity bit picks which:
 *   UPSTREAM   -> end of the wrapped visual line       e.g. (10,0)
 *   DOWNSTREAM -> start of the next visual line         e.g. (0,1)
 * (See characterization/wrap-navigation.test.ts for the behavior being preserved.)
 */
import Text, { CaretAffinity } from "./lib/Text";

const WRAPPED = "supercalifragilistic"; // ["supercalif","ragilistic"] at width 10

describe("Text.isWrapBoundary", () => {
  test("true only at a soft-wrap boundary offset (start of a continuation line)", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.isWrapBoundary(10)).toBe(true); // start of "ragilistic"
    expect(t.isWrapBoundary(9)).toBe(false);
    expect(t.isWrapBoundary(11)).toBe(false);
    expect(t.isWrapBoundary(0)).toBe(false);
  });

  test("false at a hard newline boundary (segment start is lineIndex 0)", () => {
    const t = new Text("abcde\nfghij", 100);
    expect(t.isWrapBoundary(6)).toBe(false); // start of segment 1, not a soft wrap
  });
});

describe("Text.visualFromOffset with affinity", () => {
  test("UPSTREAM renders a boundary offset at end of the wrapped line", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.visualFromOffset(10, CaretAffinity.UPSTREAM)).toEqual({
      xLine: 10,
      yLine: 0,
    });
  });

  test("DOWNSTREAM (default) renders a boundary offset at start of next line", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.visualFromOffset(10, CaretAffinity.DOWNSTREAM)).toEqual({
      xLine: 0,
      yLine: 1,
    });
    expect(t.visualFromOffset(10)).toEqual({ xLine: 0, yLine: 1 });
  });

  test("affinity is irrelevant for a non-boundary offset", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.visualFromOffset(9, CaretAffinity.UPSTREAM)).toEqual(
      t.visualFromOffset(9, CaretAffinity.DOWNSTREAM)
    );
  });
});

describe("Text.offsetWithAffinityFromVisual", () => {
  test("end of a wrapped line -> UPSTREAM", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.offsetWithAffinityFromVisual(10, 0)).toEqual({
      offset: 10,
      affinity: CaretAffinity.UPSTREAM,
    });
  });

  test("start of the next visual line -> DOWNSTREAM", () => {
    const t = new Text(WRAPPED, 10);
    expect(t.offsetWithAffinityFromVisual(0, 1)).toEqual({
      offset: 10,
      affinity: CaretAffinity.DOWNSTREAM,
    });
  });

  test("end of a segment's LAST visual line is DOWNSTREAM (no continuation)", () => {
    const t = new Text("abcde\nfghij", 100);
    expect(t.offsetWithAffinityFromVisual(5, 0)).toEqual({
      offset: 5,
      affinity: CaretAffinity.DOWNSTREAM,
    });
  });

  test("round-trips with visualFromOffset at the boundary (both affinities)", () => {
    const t = new Text(WRAPPED, 10);
    for (const [x, y] of [
      [10, 0],
      [0, 1],
      [9, 0],
      [5, 1],
    ]) {
      const { offset, affinity } = t.offsetWithAffinityFromVisual(x, y);
      expect(t.visualFromOffset(offset, affinity)).toEqual({
        xLine: x,
        yLine: y,
      });
    }
  });
});
