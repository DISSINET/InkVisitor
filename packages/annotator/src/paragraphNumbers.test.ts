/**
 * The gutter numbers paragraphs (#3305): one number per non-empty
 * newline-separated paragraph, drawn on the paragraph's first visual line.
 * Empty lines take no number, and soft-wrapped continuation lines stay blank, so
 * the numbers do not shift when the wrap width changes.
 */
import { Annotator } from "./lib/Annotator";
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";
import { Lines } from "./lib/Lines";
import Viewport from "./lib/Viewport";
import { TextMeasurer } from "./lib/TextMeasurer";

const tenPx: TextMeasurer = {
  measure: (t) => t.length * 10,
};

const mkLines = (lineHeight: number) => {
  const calls: { s: string; x: number; y: number }[] = [];
  const ctx = {
    reset() {},
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    font: "",
    fillStyle: "",
    textBaseline: "",
    fillText: (s: string, x: number, y: number) => calls.push({ s, x, y }),
  };
  const el = {
    width: 40,
    height: 600,
    style: {},
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { lines: new Lines(el, 1, lineHeight, 10), calls };
};

const viewport = (lineStart: number, lineEnd: number) =>
  ({ scrollOffsetY: 0, lineStart, lineEnd } as unknown as Viewport);

const numbersOf = (t: Text) =>
  Array.from({ length: t.noLines }, (_, l) => t.paragraphNumberStartingAt(l));

describe("Text.paragraphNumberStartingAt", () => {
  test("numbers each non-empty paragraph on its first visual line only", () => {
    // 30px budget: "abcdef" wraps to "abc" / "def"; "" is an empty line.
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    expect(t.noLines).toBe(4);
    expect(numbersOf(t)).toEqual([1, undefined, undefined, 2]);
  });

  test("empty lines do not advance the count", () => {
    const t = new Text("\n\na\n\n\nb\n", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([
      undefined,
      undefined,
      1,
      undefined,
      undefined,
      2,
      undefined,
    ]);
  });

  test("lines holding only spaces, tabs or a CRLF \\r are empty", () => {
    const t = new Text("a\r\n\r\n  \n\t\nb\r", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([1, undefined, undefined, undefined, 2]);
  });

  test("a line holding only tags is empty in every mode", () => {
    const t = new Text("<x>\nab</x>\ncd", 999, tenPx, 30);
    for (const mode of [EditMode.RAW, EditMode.HIGHLIGHT, EditMode.SEMI]) {
      t.mode = mode;
      t.calculateLines();
      expect(t.paragraphNumberStartingAt(0)).toBeUndefined();
      expect(t.paragraphNumberStartingAt(t.segments[1].lineStart)).toBe(1);
      expect(t.paragraphNumberStartingAt(t.segments[2].lineStart)).toBe(2);
    }
  });

  test("numbers follow edits that empty or fill a line", () => {
    const t = new Text("a\nb\nc", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([1, 2, 3]);

    t.value = "a\n\nc";
    t.prepareSegments();
    t.calculateLines();
    expect(numbersOf(t)).toEqual([1, undefined, 2]);
  });

  test("lines outside the document have no paragraph number", () => {
    const t = new Text("a\nb", 999, tenPx, 30);
    expect(t.paragraphNumberStartingAt(-1)).toBeUndefined();
    expect(t.paragraphNumberStartingAt(2)).toBeUndefined();
  });

  test("paragraph numbers stay put when the wrap width changes", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([1, undefined, 2]);

    t.updateMaxPixelWidth(100);
    expect(numbersOf(t)).toEqual([1, 2]);
  });
});

describe("Lines gutter draws paragraph numbers", () => {
  test("draws the paragraph number on its first row and leaves wrapped and empty rows blank", () => {
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(0, 4), (l) => t.paragraphNumberStartingAt(l));

    expect(calls.map((c) => c.s)).toEqual(["1", "2"]);
    // rows 0 and 3 at (row + 0.5) * lineHeight; row 1 wraps paragraph 1, row 2 is empty
    expect(calls.map((c) => c.y)).toEqual([10, 70]);
  });

  test("a viewport scrolled into a paragraph's wrap starts with the next paragraph's number", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(1, 3), (l) => t.paragraphNumberStartingAt(l));

    expect(calls).toEqual([{ s: "2", x: 32, y: 30 }]); // right edge (40) minus the 8px gap
  });
});

describe("going to a paragraph", () => {
  test("Text.paragraphStartLine finds the first visual line of a numbered paragraph", () => {
    // "abcdef" wraps to two lines; the empty line has no number
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    expect(t.paragraphStartLine(1)).toBe(0);
    expect(t.paragraphStartLine(2)).toBe(3);
    expect(t.paragraphStartLine(0)).toBeUndefined();
    expect(t.paragraphStartLine(3)).toBeUndefined();
  });

  test("Text.paragraphCount is the last paragraph number, trailing empty lines ignored", () => {
    expect(new Text("a\n\nb\n\n", 999, tenPx, 30).paragraphCount()).toBe(2);
    expect(new Text("", 999, tenPx, 30).paragraphCount()).toBe(0);
  });

  const setup = (value: string) => {
    const canvas = document.createElement("canvas");
    canvas.style.width = "800px";
    canvas.style.height = "600px";
    document.body.appendChild(canvas);
    const a = new Annotator(canvas, "");
    a.setMode(EditMode.RAW);
    a.onReplaceText(value);
    return a;
  };

  test("Annotator.scrollToParagraph puts a collapsed caret at the paragraph start", () => {
    const a = setup("\nfirst\n\nsecond\nthird");
    a.cursor.setPosition(3, 1);

    expect(a.scrollToParagraph(2)).toBe(true);
    expect([a.cursor.xLine, a.cursor.yLine]).toEqual([0, 3]);
    expect(a.cursor.isSelected()).toBe(false);
  });

  test("Annotator.scrollToParagraph moves the caret offsets with the visual caret", () => {
    const a = setup("first\nsecond\nthird");
    a.cursor.moveToOffset(a.text, 2);

    a.scrollToParagraph(3);
    // "third" starts at raw offset 13
    expect(a.cursor.head).toBe(13);
    expect(a.cursor.anchor).toBe(13);
  });

  test("Annotator.scrollToParagraph leaves the caret alone for a missing paragraph", () => {
    const a = setup("first\nsecond");
    a.cursor.setPosition(2, 1);

    expect(a.scrollToParagraph(3)).toBe(false);
    expect([a.cursor.xLine, a.cursor.yLine]).toEqual([2, 1]);
  });
});

describe("vertical movement after going to a paragraph", () => {
  const keyDown = (a: Annotator, key: string) =>
    a.keys.onKeyDown({
      key,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: () => {},
    } as unknown as KeyboardEvent);

  test("ArrowDown after the jump starts from the paragraph start, not an earlier column", () => {
    const canvas = document.createElement("canvas");
    canvas.style.width = "800px";
    canvas.style.height = "600px";
    document.body.appendChild(canvas);
    const a = new Annotator(canvas, "");
    a.setMode(EditMode.RAW);
    a.onReplaceText("aaaaaaaaaa\nbbbbbbbbbb\ncccccccccc\ndddddddddd");

    a.cursor.setPosition(5, 0);
    keyDown(a, "ArrowDown"); // remembers column 5
    expect([a.cursor.xLine, a.cursor.yLine]).toEqual([5, 1]);

    a.scrollToParagraph(3);
    keyDown(a, "ArrowDown");
    expect([a.cursor.xLine, a.cursor.yLine]).toEqual([0, 3]);
  });
});
