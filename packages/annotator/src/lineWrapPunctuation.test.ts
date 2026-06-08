import { Annotator } from "./lib/Annotator";
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

/** Punctuation that must never be the first character of a wrapped line. */
const LEADING_PUNCT = /^[,.;:!?)\]}»”’%]/;

/** Visible content of a line, ignoring trailing whitespace (which may overflow). */
const visibleLen = (line: string) => line.replace(/\s+$/, "").length;

describe("line wrapping - punctuation must not start a wrapped line", () => {
  test("comma after a word stays on the previous wrapped line", () => {
    // charsAtLine = 10. "aaaaaaaaa" (9) + ", " + "bbbb".
    const text = new Text("aaaaaaaaa, bbbb", 10);
    expect(text.segments[0].lines).toEqual(["aaaaaaaaa, ", "bbbb"]);
  });

  test("no wrapped line begins with punctuation across many break points", () => {
    const input =
      "alpha, beta. gamma; delta: epsilon! zeta? eta) theta word longerword";
    const text = new Text(input, 12);
    const lines = text.segments[0].lines;

    for (let i = 1; i < lines.length; i++) {
      expect(LEADING_PUNCT.test(lines[i])).toBe(false);
    }
    // Wrapping only moves break points; it never adds/drops characters.
    expect(lines.join("")).toBe(input);
  });

  test("inter-word space trails on the line so the next word starts at the margin", () => {
    // Word exactly fills the line; the following space stays trailing (invisible
    // overflow) and the next word starts the new line flush-left, like an editor.
    const text = new Text("aaaaaaaaaa bbbb", 10);
    expect(text.segments[0].lines).toEqual(["aaaaaaaaaa ", "bbbb"]);
    expect(text.segments[0].lines.join("")).toBe("aaaaaaaaaa bbbb");
  });

  test("highlight mode (tags stripped) also keeps punctuation off line starts", () => {
    const text = new Text("<x>aaaaaaaaa</x>, bbbb", 10);
    text.mode = EditMode.HIGHLIGHT;
    text.calculateLines();
    const lines = text.segments[0].lines;

    for (let i = 1; i < lines.length; i++) {
      expect(LEADING_PUNCT.test(lines[i])).toBe(false);
    }
    expect(lines.join("")).toBe("aaaaaaaaa, bbbb");
  });
});

describe("line wrapping - a word and its punctuation are one unbreakable unit", () => {
  test("a word plus trailing punctuation wraps to the next line as a whole", () => {
    // "ds." must not be split: the whole unit moves to the next line instead of
    // leaving "." (or the cursor) past the visible width.
    const text = new Text("abcdefg ds.", 10);
    expect(text.segments[0].lines).toEqual(["abcdefg ", "ds."]);
  });

  test("a word longer than the line is character-broken to fit the width", () => {
    const input = "supercalifragilistic"; // 20 chars
    const text = new Text(input, 10);
    const lines = text.segments[0].lines;

    expect(lines).toEqual(["supercalif", "ragilistic"]);
    expect(lines.join("")).toBe(input);
  });

  test("no line's visible content ever exceeds charsAtLine", () => {
    const inputs = [
      "alpha, beta. gamma; delta: epsilon! zeta? eta) theta word longerword",
      "abcdefg ds. hij, klmno. pqrstuvwxyz!",
      "one two three four five six seven eight nine ten eleven twelve",
      "wordwordwordwordword, short (parenthetical) end.",
      '<person id="1234567890">name</person> tail', // RAW tags wider than small widths
    ];
    for (const input of inputs) {
      for (const charsAtLine of [6, 8, 10, 12, 20]) {
        const text = new Text(input, charsAtLine);
        for (const line of text.segments[0].lines) {
          expect(visibleLen(line)).toBeLessThanOrEqual(charsAtLine);
        }
        expect(text.segments[0].lines.join("")).toBe(input);
      }
    }
  });

  test("a tag wider than the line is character-broken in RAW mode (no overflow)", () => {
    // RAW mode shows tags as literal text. With no horizontal scroll, a tag
    // longer than the line must break rather than run off the right edge.
    const input = '<person id="123">John</person>'; // opening tag alone is 17
    const text = new Text(input, 15);
    for (const line of text.segments[0].lines) {
      expect(visibleLen(line)).toBeLessThanOrEqual(15);
    }
    expect(text.segments[0].lines.join("")).toBe(input);
  });

  test("indices round-trip through a character-broken long word", () => {
    const input = "supercalifragilisticexpialidocious"; // > charsAtLine
    const text = new Text(input, 10);
    expect(text.segments[0].lines.length).toBeGreaterThan(1);
    // Single segment, so the absolute index equals the raw index throughout.
    for (let i = 0; i <= input.length; i++) {
      const pos = text.getSegmentFromAbsTextIndex(i);
      expect(pos).not.toBeNull();
      expect(text.getAbsTextIndexFromPosition(pos)).toBe(i);
    }
  });
});

describe("annotator: typing punctuation at a full line keeps the cursor on screen", () => {
  let annotator: Annotator;
  let mockCanvas: HTMLCanvasElement;

  const keyDown = (key: string) =>
    annotator.keys.onKeyDown({
      key,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: () => {},
    } as unknown as KeyboardEvent);

  beforeEach(() => {
    mockCanvas = document.createElement("canvas");
    mockCanvas.style.width = "800px";
    mockCanvas.style.height = "600px";
    document.body.appendChild(mockCanvas);
    annotator = new Annotator(mockCanvas, "");
    annotator.setMode(EditMode.RAW);
  });

  afterEach(() => {
    mockCanvas.parentNode?.removeChild(mockCanvas);
  });

  test('typing "." after a word at the line end wraps "ds." down, cursor stays visible', () => {
    const charsAtLine = annotator.text.charsAtLine;
    // "...x ds" fills exactly to the line end, with "ds" as the last word.
    annotator.onReplaceText("x".repeat(charsAtLine - 3) + " ds");
    annotator.cursor.setPosition(charsAtLine, 0);

    keyDown(".");

    expect(annotator.text.value.endsWith("ds.")).toBe(true);
    // "ds." moved to the next line as a unit (not left dangling off the edge).
    expect(annotator.text.getLine(1)).toBe("ds.");
    // The cursor follows it and stays within the visible width (no horizontal
    // scroll exists, so xLine must never exceed charsAtLine).
    expect(annotator.cursor.xLine).toBeLessThanOrEqual(charsAtLine);
  });
});
