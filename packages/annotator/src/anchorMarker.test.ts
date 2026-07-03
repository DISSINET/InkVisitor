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
    expect(lines).toEqual([
      { op: "moveTo", x: 100, y: 45 }, // vertical arm top (yMid 50 - half 5)
      { op: "lineTo", x: 100, y: 55 }, // vertical arm bottom
      { op: "moveTo", x: 100, y: 45 }, // top arm origin
      { op: "lineTo", x: 104, y: 45 }, // top arm runs right by armW
    ]);
  });

  test("end marker draws └ — vertical arm + bottom arm running right", () => {
    const { ctx, ops } = mkCtx();
    drawAnchorMarker(ctx, 100, 50, "end", style);

    const lines = ops.filter((o) => o.op === "moveTo" || o.op === "lineTo");
    expect(lines).toEqual([
      { op: "moveTo", x: 100, y: 45 }, // vertical arm top
      { op: "lineTo", x: 100, y: 55 }, // vertical arm bottom
      { op: "moveTo", x: 100, y: 55 }, // bottom arm origin
      { op: "lineTo", x: 104, y: 55 }, // bottom arm runs right by armW
    ]);
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
