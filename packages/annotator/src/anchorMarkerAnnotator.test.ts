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
  drawAnchorMarker: jest.fn(),
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
});
