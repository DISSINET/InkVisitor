/**
 * #2076 — paragraph-mark placement against Territory anchor markers, end-to-end
 * through Annotator.draw().
 *
 * The ¶ marks are held over from the text pass and drawn last, each nudged
 * right until it clears any END anchor marker (┘) occupying its spot; start
 * markers (┌) open toward the text, so the mark sits inside their corner
 * without moving. A mark pinned at the canvas' right edge cannot move at all,
 * so its dodge search ends immediately.
 *
 * The drawn output is observed by spying on the private drawParagraphMark —
 * its third argument is the final dodge shift — and positions are derived
 * through the same private paragraphMarkGeometry the dodge loop uses.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode, HighlightMode } from "./lib/constants";

jest.mock("./lib/AnchorMarker", () => ({
  // Box keyed off the draw coords, mirroring the real fn's return shape.
  drawAnchorMarker: jest.fn((_ctx: unknown, xPx: number, yMid: number) => ({
    x: xPx,
    y: yMid - 5,
    w: 4,
    h: 10,
  })),
}));

const anchorSchema = {
  mode: HighlightMode.ANCHOR,
  style: { color: "#2079DF", opacity: 1 },
};

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
};

/** Spy capturing every drawParagraphMark(x, y, shiftX) of a draw pass. */
const spyMarks = () =>
  jest.spyOn(Annotator.prototype as any, "drawParagraphMark").mockImplementation(() => {});

afterEach(() => {
  jest.restoreAllMocks();
  // setShowParagraphMarks persists; keep it out of the next test's Annotator.
  localStorage.clear();
});

describe("paragraph mark dodges anchor markers (#2076)", () => {
  test("mark lands clear of an end marker at the paragraph end", () => {
    // The anchor ends where paragraph one ends, so its ┘ marker is drawn at
    // the very spot the ¶ mark wants: right after the line's last character.
    const a = mk("foo <T1>bar</T1>\nnext");
    a.setShowParagraphMarks(true);
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);

    const spy = spyMarks();
    a.draw();

    const inst = a as any;
    const endBoxes = inst.anchorMarkerHitboxes.filter((hb: any) => hb.kind === "end");
    expect(endBoxes).toHaveLength(1);
    const clearOf = endBoxes[0].x + endBoxes[0].w;

    // The first paragraph's mark shares the marker's line: the hitbox is
    // padded symmetrically around the marker, so its vertical centre is the
    // line's midline — the y both glyphs are drawn at.
    const yMid = endBoxes[0].y + endBoxes[0].h / 2;
    const call = spy.mock.calls.find(([, y]) => y === yMid) as number[];
    expect(call).toBeDefined();
    const [x, y, shiftX] = call;
    expect(shiftX).toBeGreaterThan(0);
    expect(inst.paragraphMarkGeometry(x, y, shiftX).left).toBeGreaterThanOrEqual(clearOf);
  });

  test("a start marker at the paragraph end does not move the mark", () => {
    // The anchor opens at the end of paragraph one (its text begins on the next
    // line), so a ┌ marker sits where the ¶ mark goes — and is ignored.
    const a = mk("foo <T1>\nnext</T1>");
    a.setShowParagraphMarks(true);
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);

    const spy = spyMarks();
    a.draw();

    const inst = a as any;
    const startHb = inst.anchorMarkerHitboxes.find((hb: any) => hb.kind === "start");
    expect(startHb).toBeDefined();

    // The anchor's own end marker (on the last line) still dodges its ¶, so
    // only the mark on the start marker's line is asserted still.
    const yMid = startHb.y + startHb.h / 2;
    const call = spy.mock.calls.find(([, y]) => y === yMid) as number[];
    expect(call).toBeDefined();
    const [x, y, shiftX] = call;
    expect(shiftX).toBe(0);

    // Not vacuous: unmoved, the mark does overlap the start marker's hitbox.
    const g = inst.paragraphMarkGeometry(x, y, 0);
    expect(g.left < startHb.x + startHb.w && g.left + g.markW > startHb.x).toBe(true);
  });

  test("a mark pinned at the right edge stays put and stays inside", () => {
    const a = mk("word");
    const inst = a as any;
    const spy = jest.spyOn(inst, "drawParagraphMark").mockImplementation(() => {});

    // A mark anchored at the canvas edge pins at width - markW; the marker
    // covering that spot cannot be cleared by any shift.
    const y = inst.lineHeight / 2;
    inst.pendingParagraphMarks = [{ x: inst.width, y }];
    inst.anchorMarkerHitboxes = [
      { x: inst.width - 50, y: y - 10, w: 60, h: 20, kind: "end", tag: {} },
    ];
    inst.drawPendingParagraphMarks();

    expect(spy).toHaveBeenCalledTimes(1);
    const [x, yArg, shiftX] = spy.mock.calls[0] as number[];
    expect(shiftX).toBe(0);
    const geom = inst.paragraphMarkGeometry(x, yArg, shiftX);
    expect(geom.left).toBe(inst.width - geom.markW);
  });
});
