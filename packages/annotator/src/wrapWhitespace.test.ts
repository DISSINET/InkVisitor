import { Annotator } from "./lib/Annotator";
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

function keyDown(a: Annotator, key: string) {
  a.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent);
}

const MAXLEN = 10;
function setup(value: string): Annotator {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  document.body.appendChild(canvas);
  const a = new Annotator(canvas, "");
  a.setMode(EditMode.RAW);
  a.onReplaceText(value);
  a.text.updateCharsAtLine(MAXLEN);
  return a;
}

/** Visible content of a line, ignoring trailing whitespace collapsed in the margin. */
const visibleLen = (line: string) => line.replace(/\s+$/, "").length;
/** The column at which the caret is actually rendered (Cursor.draw clamps to the width). */
const drawnCaretX = (a: Annotator) => Math.min(a.cursor.xLine, a.text.charsAtLine);

// No horizontal scroll and no wrapped line ever begins with whitespace
// (Google-Docs style): an overflowing inter-word space run stays trailing on the
// current line, collapsed into the margin past the visible edge.
describe("whitespace wrapping model", () => {
  describe("overflow whitespace trails the previous line, never leads the next", () => {
    test("overflowing trailing spaces stay on the line, collapsed in the margin", () => {
      // 8 content + 3 spaces, width 10: all spaces stay trailing on the one line
      const text = new Text("aaaaaaaa   ", 10);
      expect(text.segments[0].lines).toEqual(["aaaaaaaa   "]);
    });

    test("an overflowing inter-word space trails line 0; the word starts line 1 flush", () => {
      // 9 letters + 2 spaces + "cc": the spaces overflow but stay trailing on line 0
      const a = setup("aaaaaaaaa  cc");
      expect(a.text.getLine(0)).toBe("aaaaaaaaa  "); // two trailing spaces, in the margin
      expect(a.text.getLine(1)).toBe("cc"); // the word starts flush, no leading space
    });

    test("a single wrap space on a non-full line still trails (no leading space)", () => {
      // the space fits at col 7, so it stays trailing rather than leading line 1
      const a = setup("aa bb ccccccccc");
      expect(a.text.getLine(0)).toBe("aa bb ");
      expect(a.text.getLine(1)).toBe("ccccccccc");
    });
  });

  describe("no visual line's visible content is ever wider than the viewport", () => {
    test("inter-word wrap whitespace keeps every line's visible content within the width", () => {
      const a = setup("aaaaaaaaa  cc");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(visibleLen(a.text.getLine(l))).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("a large inter-word whitespace run trails the line; the word stays flush", () => {
      const a = setup("a" + " ".repeat(25) + "b");
      expect(a.text.getLine(1)).toBe("b"); // the word begins the next line flush
      for (let l = 0; l < a.text.noLines; l++) {
        expect(visibleLen(a.text.getLine(l))).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("leading indentation is kept and the word after it starts flush", () => {
      const a = setup(" ".repeat(30) + "word");
      expect(a.text.getLine(1)).toBe("word");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(visibleLen(a.text.getLine(l))).toBeLessThanOrEqual(MAXLEN);
      }
    });
  });

  describe("typing spaces never pushes the caret off screen", () => {
    test("typing overflowing trailing spaces keeps them on line 0, caret draw-clamped", () => {
      const a = setup("aaaaaa"); // 6 chars, width 10
      a.cursor.setPosition(6, 0);
      for (let i = 0; i < 5; i++) keyDown(a, " ");
      // all 5 spaces stay trailing on the one line (no wrap to a leading-space line)
      expect(a.text.segments[0].lines).toEqual(["aaaaaa     "]);
      expect(a.text.noLines).toBe(1);
      // the caret's rendered column is clamped to the width so it stays visible
      expect(drawnCaretX(a)).toBe(MAXLEN);
    });

    test("typing many trailing spaces keeps visible content and the caret within the width", () => {
      const a = setup("ccccc");
      a.cursor.setPosition(5, 0); // end of "ccccc"
      for (let i = 0; i < 25; i++) {
        keyDown(a, " ");
        for (let l = 0; l < a.text.noLines; l++) {
          expect(visibleLen(a.text.getLine(l))).toBeLessThanOrEqual(MAXLEN);
        }
        // the drawn caret column stays inside the visible width
        expect(drawnCaretX(a)).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("trailing spaces on an otherwise empty line keep the caret draw-clamped", () => {
      const a = setup("");
      a.cursor.setPosition(0, 0);
      for (let i = 0; i < 25; i++) keyDown(a, " ");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(visibleLen(a.text.getLine(l))).toBeLessThanOrEqual(MAXLEN);
      }
      expect(drawnCaretX(a)).toBeLessThanOrEqual(MAXLEN);
    });
  });

  describe("a space that still fits keeps the caret on the same line", () => {
    test("typing a space within the line's room stays on line 0", () => {
      const a = setup("aaa bbb "); // 8 chars incl. a trailing space, room for 2
      a.cursor.setPosition(8, 0);
      keyDown(a, " ");
      expect(a.text.getLine(0)).toBe("aaa bbb  "); // 9 chars, still fits
      expect(a.cursor.yLine).toBe(0);
      expect(a.text.noLines).toBe(1);
    });

    test("typing a space at a wrapped line end with room keeps the caret on that line", () => {
      // the new space lands on the soft-wrap boundary; the caret must stay at
      // line 0's end (where it was typed), not jump to line 1
      const a = setup("aa bb cccccccc");
      expect(a.text.getLine(0)).toBe("aa bb ");
      expect(a.text.getLine(1)).toBe("cccccccc");

      a.cursor.setPosition(6, 0); // end of line 0 (after the trailing space)
      keyDown(a, " ");

      expect(a.text.value).toBe("aa bb  cccccccc");
      expect(a.text.getLine(0)).toBe("aa bb  "); // the new space stays on line 0
      expect(a.cursor.yLine).toBe(0); // caret stays on line 0
      expect(a.cursor.xLine).toBe(7); // just after the two spaces
    });
  });

  // The core invariant: a soft-wrap never carries whitespace to the start of a
  // continuation line. The word that would have followed the wrap space begins
  // the next line flush-left instead (only a segment's first line may keep the
  // source's own leading whitespace).
  describe("no wrapped continuation line begins with whitespace", () => {
    const inputs = [
      "aaaa bbbbb ccccc",
      "aaaaaaaaaa bbbb",
      "aaaaaaaaa, bbbb",
      "one two three four five six seven eight nine ten",
      "aaaaaaaaaa          bbbb", // a long inter-word whitespace run
      "Ianuensi et ab eodem fratre Galvano cytatus iuravit", // mirrors the manuscript wrap
    ];
    for (const input of inputs) {
      test(`"${input}" wraps with every continuation line flush-left`, () => {
        for (const w of [6, 8, 10, 12, 20]) {
          const lines = new Text(input, w).segments[0].lines;
          for (let i = 1; i < lines.length; i++) {
            expect(lines[i].startsWith(" ")).toBe(false);
          }
          // wrapping only moves break points; it never adds or drops characters
          expect(lines.join("")).toBe(input);
        }
      });
    }
  });
});
