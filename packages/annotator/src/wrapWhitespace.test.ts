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

// No horizontal scroll: renderable spaces fill the line, overflow wraps to the
// next visual line so it stays visible (#3145).
describe("whitespace wrapping model (#3145)", () => {
  describe("renderable spaces trail, overflow leads/wraps", () => {
    test("trailing spaces fill the line to the width before overflowing", () => {
      // 8 content + 3 spaces, width 10: 2 spaces fit, only the 3rd overflows
      const text = new Text("aaaaaaaa   ", 10);
      expect(text.segments[0].lines).toEqual(["aaaaaaaa  ", " "]);
    });

    test("two spaces split across the boundary instead of overflowing line 1", () => {
      // 9 letters + 2 spaces + "cc": one space fits, the second overflows
      const a = setup("aaaaaaaaa  cc");
      expect(a.text.getLine(0)).toBe("aaaaaaaaa "); // one trailing space
      expect(a.text.getLine(1)).toBe(" cc"); // overflow space leads line 2
    });

    test("a single wrap space on a non-full line still trails (no leading space)", () => {
      // the space fits at col 7, so it stays trailing rather than leading line 1
      const a = setup("aa bb ccccccccc");
      expect(a.text.getLine(0)).toBe("aa bb ");
      expect(a.text.getLine(1)).toBe("ccccccccc");
    });
  });

  describe("no visual line is ever wider than the viewport", () => {
    test("inter-word wrap whitespace keeps every line within the width", () => {
      const a = setup("aaaaaaaaa  cc");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(a.text.getLine(l).length).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("a large inter-word whitespace run wraps instead of overflowing one line", () => {
      const a = setup("a" + " ".repeat(25) + "b");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(a.text.getLine(l).length).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("leading indentation before a word wraps instead of overflowing", () => {
      const a = setup(" ".repeat(30) + "word");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(a.text.getLine(l).length).toBeLessThanOrEqual(MAXLEN);
      }
    });
  });

  describe("typing spaces never pushes the caret off screen", () => {
    test("typing the overflowing space keeps the fitting spaces on line 0", () => {
      const a = setup("aaaaaa"); // 6 chars, width 10
      a.cursor.setPosition(6, 0);
      for (let i = 0; i < 5; i++) keyDown(a, " ");
      // 4 spaces fill line 0 up to the width; only the 5th overflows to line 1
      expect(a.text.getLine(0)).toBe("aaaaaa    ");
      expect(a.text.getLine(1)).toBe(" ");
    });

    test("typing many trailing spaces keeps every wrapped line within the width", () => {
      const a = setup("ccccc");
      a.cursor.setPosition(5, 0); // end of "ccccc"
      for (let i = 0; i < 25; i++) {
        keyDown(a, " ");
        for (let l = 0; l < a.text.noLines; l++) {
          expect(a.text.getLine(l).length).toBeLessThanOrEqual(MAXLEN);
        }
        // caret must stay inside the visible width
        expect(a.cursor.xLine).toBeLessThanOrEqual(MAXLEN);
      }
    });

    test("trailing spaces on an otherwise empty line wrap instead of running off", () => {
      const a = setup("");
      a.cursor.setPosition(0, 0);
      for (let i = 0; i < 25; i++) keyDown(a, " ");
      for (let l = 0; l < a.text.noLines; l++) {
        expect(a.text.getLine(l).length).toBeLessThanOrEqual(MAXLEN);
      }
      expect(a.cursor.xLine).toBeLessThanOrEqual(MAXLEN);
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
});
