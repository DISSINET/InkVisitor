/**
 * Issue #2887 — Territory anchor corner markers.
 *
 * `drawAnchorMarker` is the single glyph primitive: a vertical arm centred on
 * the line, plus a top arm running right for `start` (┌) or a bottom arm
 * running left for `end` (┘). These tests pin the exact path so the corner
 * orientation and stacking offsets stay stable.
 */
import { drawAnchorMarker } from "./lib/AnchorMarker";

type Op =
  | { op: "moveTo"; x: number; y: number }
  | { op: "lineTo"; x: number; y: number }
  | { op: "beginPath" }
  | { op: "stroke" };

const mkCtx = () => {
  const ops: Op[] = [];
  const state = { strokeStyle: "", lineWidth: 0, globalAlpha: -1, gco: "" };
  const ctx = {
    beginPath: () => ops.push({ op: "beginPath" }),
    moveTo: (x: number, y: number) => ops.push({ op: "moveTo", x, y }),
    lineTo: (x: number, y: number) => ops.push({ op: "lineTo", x, y }),
    stroke: () => ops.push({ op: "stroke" }),
    save: () => {},
    restore: () => {},
    set strokeStyle(v: string) {
      state.strokeStyle = v;
    },
    set lineWidth(v: number) {
      state.lineWidth = v;
    },
    set globalAlpha(v: number) {
      state.globalAlpha = v;
    },
    set globalCompositeOperation(v: string) {
      state.gco = v;
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, ops, state };
};

const style = { armH: 10, armW: 4, lineWidth: 2, color: "#2079DF" };

describe("drawAnchorMarker", () => {
  test("start marker draws ┌ — vertical arm + top arm running right", () => {
    const { ctx, ops } = mkCtx();
    drawAnchorMarker(ctx, 100, 50, "start", style);

    const lines = ops.filter((o) => o.op === "moveTo" || o.op === "lineTo");
    // x0 = xPx(100) + lineWidth(2)/2 = 101; armW = 4; half = armH(10)/2 = 5.
    expect(lines).toEqual([
      { op: "moveTo", x: 101, y: 45 }, // vertical stem top
      { op: "lineTo", x: 101, y: 55 }, // vertical stem bottom
      { op: "moveTo", x: 101, y: 45 }, // top arm origin
      { op: "lineTo", x: 105, y: 45 }, // top arm runs right by armW
    ]);
  });

  test("end marker draws ┘ — stem at boundary, bottom arm running left over content", () => {
    const { ctx, ops } = mkCtx();
    drawAnchorMarker(ctx, 100, 50, "end", style);

    const lines = ops.filter((o) => o.op === "moveTo" || o.op === "lineTo");
    // Inline (xPx 100 » inset): stem at the boundary (100), arm left to xPx-armW (96).
    expect(lines).toEqual([
      { op: "moveTo", x: 100, y: 45 }, // stem top
      { op: "lineTo", x: 100, y: 55 }, // stem bottom
      { op: "moveTo", x: 100, y: 55 }, // bottom arm origin at the corner
      { op: "lineTo", x: 96, y: 55 }, // runs left over the content by armW
    ]);
  });

  test("end marker clamps at the left margin — nothing drawn at negative x", () => {
    const { ctx, ops } = mkCtx();
    drawAnchorMarker(ctx, 0, 50, "end", style); // boundary at the very left edge

    const lines = ops.filter((o) => o.op === "moveTo" || o.op === "lineTo");
    // leftX = max(0 - armW(4), inset(1)) = 1; stem = 1 + 4 = 5.
    expect(lines).toEqual([
      { op: "moveTo", x: 5, y: 45 },
      { op: "lineTo", x: 5, y: 55 },
      { op: "moveTo", x: 5, y: 55 },
      { op: "lineTo", x: 1, y: 55 },
    ]);
    expect(lines.every((l) => (l as { x: number }).x >= 0)).toBe(true);
  });

  test("returns the drawn bounding box (used for the hover hit target)", () => {
    const { ctx } = mkCtx();
    expect(drawAnchorMarker(ctx, 100, 50, "start", style)).toEqual({
      x: 101, // stem at xPx + inset
      y: 45,
      w: 4, // armW
      h: 10, // armH
    });
    expect(drawAnchorMarker(ctx, 100, 50, "end", style)).toEqual({
      x: 96, // leftmost = xPx - armW
      y: 45,
      w: 4,
      h: 10,
    });
  });

  test("uses the passed colour and line width, and strokes once", () => {
    const { ctx, ops, state } = mkCtx();
    drawAnchorMarker(ctx, 10, 20, "start", style);
    expect(state.strokeStyle).toBe("#2079DF");
    expect(state.lineWidth).toBe(2);
    expect(state.globalAlpha).toBe(1); // full opacity regardless of prior passes
    expect(ops.filter((o) => o.op === "stroke")).toHaveLength(1);
  });
});
