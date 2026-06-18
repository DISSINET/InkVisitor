import Text from "./lib/Text";
import Cursor from "./lib/Cursor";
import { EditMode } from "./lib/constants";

/**
 * Issue #3108 — unit tests for the offset-space clamp behind the selection drag
 * handles. The pixel/DOM layer (getBoundingClientRect, hit-testing) is not
 * testable in jsdom (0-sized rects), so the contract is verified at the pure
 * Cursor + Text seam: Cursor.dragBoundary (resize one boundary) and
 * Cursor.setSpanByOffsets (move the whole span).
 */

const RATIO = 1;

const makeText = (
  value: string,
  charsAtLine = 100,
  mode: EditMode = EditMode.RAW
): Text => {
  const t = new Text(value, charsAtLine);
  if (mode !== EditMode.RAW) {
    t.mode = mode;
    // Recompute segments/lines so hidden tag markup is stripped (mirrors setMode).
    t.prepareSegments();
    t.calculateLines();
  }
  return t;
};

const selectForward = (
  cursor: Cursor,
  sx: number,
  sy: number,
  ex: number,
  ey: number
) => {
  cursor.selectStart = { xLine: sx, yLine: sy };
  cursor.selectEnd = { xLine: ex, yLine: ey };
  cursor.setTrueSelectionDirection();
};

/** Visible-column width of a single-line selection. */
const lineWidth = (cursor: Cursor): number => {
  const [s, e] = cursor.getAbsBounds();
  if (!s || !e) return 0;
  return e.xLine - s.xLine;
};

describe("#3108 Cursor.dragBoundary — resize one boundary, single line", () => {
  // "hello world" — 11 chars on one line, visual columns == raw offsets.
  const VALUE = "hello world";

  let text: Text;
  let cursor: Cursor;

  beforeEach(() => {
    text = makeText(VALUE);
    cursor = new Cursor(RATIO, 0, 0);
    // Select "llo w" → columns [2, 7).
    selectForward(cursor, 2, 0, 7, 0);
  });

  it("moves only the start boundary, keeping the end fixed", () => {
    cursor.dragBoundary(text, "start", 0, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 0, yLine: 0 });
    expect(e).toEqual({ xLine: 7, yLine: 0 });
  });

  it("moves only the end boundary, keeping the start fixed", () => {
    cursor.dragBoundary(text, "end", 10, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 2, yLine: 0 });
    expect(e).toEqual({ xLine: 10, yLine: 0 });
  });

  it("clamps the start so it cannot reach the end (min 1 char)", () => {
    // Drag the start all the way onto the end column.
    cursor.dragBoundary(text, "start", 7, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 6, yLine: 0 }); // pinned one char before the end
    expect(e).toEqual({ xLine: 7, yLine: 0 });
    expect(lineWidth(cursor)).toBe(1);
    expect(cursor.isSelected()).toBe(true);
  });

  it("clamps the start so it cannot cross (reverse past) the end", () => {
    // Drag the start far past the end.
    cursor.dragBoundary(text, "start", 11, 0);
    expect(lineWidth(cursor)).toBe(1);
    expect(cursor.getAbsBounds()[0]).toEqual({ xLine: 6, yLine: 0 });
  });

  it("clamps the end so it cannot reach/cross the start (min 1 char)", () => {
    cursor.dragBoundary(text, "end", 0, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 2, yLine: 0 });
    expect(e).toEqual({ xLine: 3, yLine: 0 }); // pinned one char after the start
    expect(lineWidth(cursor)).toBe(1);
  });

  it("keeps the canonical offset model in sync (head=moving, anchor=fixed)", () => {
    cursor.dragBoundary(text, "end", 9, 0);
    // Single line, no tags → visual column === raw offset.
    expect(cursor.head).toBe(9); // moving boundary
    expect(cursor.anchor).toBe(2); // fixed boundary
  });

  it("clamps a beyond-line-end request to the line length", () => {
    cursor.dragBoundary(text, "end", 999, 0);
    expect(cursor.getAbsBounds()[1]).toEqual({ xLine: VALUE.length, yLine: 0 });
  });
});

describe("#3108 Cursor.dragBoundary — across lines", () => {
  // Two lines: "ab" (line 0) and "cd" (line 1).
  const VALUE = "ab\ncd";

  it("clamps the end against the start without going negative across the wrap", () => {
    const text = makeText(VALUE);
    const cursor = new Cursor(RATIO, 0, 0);
    // Select "a" → start (0,0), end (1,0).
    selectForward(cursor, 0, 0, 1, 0);
    // Try to drag the end back onto the start.
    cursor.dragBoundary(text, "end", 0, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 0, yLine: 0 });
    expect(e).toEqual({ xLine: 1, yLine: 0 });
    expect(cursor.isSelected()).toBe(true);
  });

  it("can extend the end onto the next line", () => {
    const text = makeText(VALUE);
    const cursor = new Cursor(RATIO, 0, 0);
    selectForward(cursor, 0, 0, 2, 0); // "ab"
    cursor.dragBoundary(text, "end", 1, 1); // extend onto line 1, column 1
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 0, yLine: 0 });
    expect(e).toEqual({ xLine: 1, yLine: 1 });
  });
});

describe("#3108 Cursor.dragBoundary — HIGHLIGHT mode hidden markup", () => {
  // Visible text "abcdef" with hidden tag markup between 'b' and 'c'.
  const VALUE = "ab<x1>cd</x1>ef";

  it("enforces min 1 VISIBLE char even when offsets straddle hidden markup", () => {
    const text = makeText(VALUE, 100, EditMode.HIGHLIGHT);
    const cursor = new Cursor(RATIO, 0, 0);
    // Select the single visible char 'b' → columns [1, 2) on line 0.
    selectForward(cursor, 1, 0, 2, 0);

    // Drag the start onto the end column; must pin one visible column before it.
    cursor.dragBoundary(text, "start", 2, 0);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 1, yLine: 0 });
    expect(e).toEqual({ xLine: 2, yLine: 0 });
    expect(lineWidth(cursor)).toBe(1); // 1 VISIBLE char

    // Dragging the START makes head the moving start ('b') and anchor the fixed
    // end ('c'). The raw offsets straddle the hidden <x1> markup, so the raw gap
    // is > 1 even though the visible gap is exactly 1 — the clamp is offset-correct.
    expect(cursor.head).toBe(1); // 'b'
    expect(cursor.anchor).toBeGreaterThan(2); // 'c' lives past the hidden markup
  });
});

describe("#3108 Cursor.setSpanByOffsets — move the whole span", () => {
  const VALUE = "hello world";

  it("sets a forward-oriented span from raw offsets", () => {
    const text = makeText(VALUE);
    const cursor = new Cursor(RATIO, 0, 0);
    cursor.setSpanByOffsets(text, 2, 7);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 2, yLine: 0 });
    expect(e).toEqual({ xLine: 7, yLine: 0 });
    expect(cursor.anchor).toBe(2);
    expect(cursor.head).toBe(7);
  });

  it("clamps offsets into the document", () => {
    const text = makeText(VALUE);
    const cursor = new Cursor(RATIO, 0, 0);
    cursor.setSpanByOffsets(text, 8, 999);
    const [s, e] = cursor.getAbsBounds();
    expect(s).toEqual({ xLine: 8, yLine: 0 });
    expect(e).toEqual({ xLine: VALUE.length, yLine: 0 });
  });
});
