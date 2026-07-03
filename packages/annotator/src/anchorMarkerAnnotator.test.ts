/**
 * Issue #2887 — Territory anchor markers, end-to-end through Annotator.draw().
 *
 * Verifies the wiring the glyph unit test (anchorMarker.test.ts) does not:
 * an ANCHOR-mode highlight schema returned from onHighlight is resolved to its
 * two endpoints (getTagPosition → higlightItems) and drawn as a start (┌) and
 * an end (┘) marker, while span highlight modes are unaffected.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode, HighlightMode } from "./lib/constants";
import { drawAnchorMarker } from "./lib/AnchorMarker";

jest.mock("./lib/AnchorMarker", () => ({
  // Return a plausible bounding box keyed off the draw coords so the recorded
  // hitboxes reflect distinct positions (the real fn returns its drawn box).
  drawAnchorMarker: jest.fn((_ctx: unknown, xPx: number, yMid: number) => ({
    x: xPx,
    y: yMid - 5,
    w: 4,
    h: 10,
  })),
}));

const markerMock = drawAnchorMarker as jest.Mock;

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
};

const anchorSchema = {
  mode: HighlightMode.ANCHOR,
  style: { color: "#2079DF", opacity: 1 },
};

beforeEach(() => markerMock.mockClear());

describe("Annotator draws Territory anchor markers (#2887)", () => {
  test("an ANCHOR schema draws a start and an end marker for the anchor", () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);
    a.draw();

    const kinds = markerMock.mock.calls.map((c) => c[3]); // 4th arg = kind
    expect(kinds).toContain("start");
    expect(kinds).toContain("end");
    expect(kinds).toHaveLength(2);
  });

  test("start marker sits left of the end marker on the same line", () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);
    a.draw();

    const byKind = (k: string) =>
      markerMock.mock.calls.find((c) => c[3] === k);
    const startX = byKind("start")![1]; // 2nd arg = xPx
    const endX = byKind("end")![1];
    expect(startX).toBeLessThan(endX);
  });

  test("passes the schema colour through to the glyph", () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);
    a.draw();

    expect(markerMock).toHaveBeenCalled();
    for (const call of markerMock.mock.calls) {
      expect(call[4].color).toBe("#2079DF"); // 5th arg = style
    }
  });

  test("no markers drawn when no ANCHOR schema is returned", () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => undefined);
    a.draw();

    expect(markerMock).not.toHaveBeenCalled();
  });

  test("a schema array (FOCUS + ANCHOR) still draws the markers (#2887 active T)", () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    // The active territory returns both a dim wash and the anchor markers.
    a.onHighlight(() => [
      { mode: HighlightMode.FOCUS, style: { color: "#000", opacity: 0.08 } },
      anchorSchema,
    ]);
    a.draw();

    const kinds = markerMock.mock.calls.map((c) => c[3]);
    expect(kinds).toEqual(expect.arrayContaining(["start", "end"]));
  });
});

// #2887 — hover a marker to preview its territory. Hitboxes are recorded in
// Annotator.drawAnchorMarkers (independent of the mocked glyph draw), so they
// are populated after draw() and drive the reused onAnchorTagHover channel.
describe("Territory anchor marker hover (#2887)", () => {
  const drawWithMarkers = () => {
    const a = mk("foo <T1>bar</T1> baz");
    a.setMode(EditMode.HIGHLIGHT);
    a.onHighlight(() => anchorSchema);
    a.draw();
    return a;
  };

  // Build a pointer event landing at a hitbox centre (inverse of the draw-space
  // transform: mx = offsetX*ratio, my = offsetY*ratio + scrollOffsetY).
  const eventAtHitbox = (a: Annotator, hb: { x: number; y: number; w: number; h: number }) => {
    const ratio = (a as any).ratio as number;
    const scrollY = (a as any).viewport.scrollOffsetY as number;
    return {
      offsetX: (hb.x + hb.w / 2) / ratio,
      offsetY: (hb.y + hb.h / 2 - scrollY) / ratio,
      pageX: 111,
      pageY: 222,
    } as MouseEvent;
  };

  test("draw records one hitbox per marker, tagged with the anchor", () => {
    const a = drawWithMarkers();
    const boxes = (a as any).anchorMarkerHitboxes as { tag: any }[];
    expect(boxes).toHaveLength(2); // start + end
    expect(boxes.every((b) => b.tag.getTagName() === "T1")).toBe(true);
  });

  test("pointer over a marker resolves its Tag", () => {
    const a = drawWithMarkers();
    const boxes = (a as any).anchorMarkerHitboxes;
    const tag = (a as any).hitTestAnchorMarker(eventAtHitbox(a, boxes[0]));
    expect(tag?.getTagName()).toBe("T1");
  });

  test("pointer off every marker resolves null", () => {
    const a = drawWithMarkers();
    const tag = (a as any).hitTestAnchorMarker({
      offsetX: 9999,
      offsetY: 9999,
    } as MouseEvent);
    expect(tag).toBeNull();
  });

  test("hovering a marker emits (tag, page position) on the tag-hover channel", () => {
    const a = drawWithMarkers();
    const hoverCb = jest.fn();
    a.onAnchorTagHover(hoverCb);
    const boxes = (a as any).anchorMarkerHitboxes;

    (a as any).detectAndEmitAnchorTagHover(eventAtHitbox(a, boxes[0]));

    expect(hoverCb).toHaveBeenCalledTimes(1);
    const [tag, pos] = hoverCb.mock.calls[0];
    expect(tag.getTagName()).toBe("T1");
    expect(pos).toEqual({ x: 111, y: 222 });
  });

  test("marker hitboxes are cleared when leaving HIGHLIGHT mode", () => {
    const a = drawWithMarkers();
    expect((a as any).anchorMarkerHitboxes.length).toBe(2);
    a.setMode(EditMode.RAW);
    a.draw();
    expect((a as any).anchorMarkerHitboxes.length).toBe(0);
  });
});
