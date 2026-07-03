import { Annotator } from "./lib/Annotator";
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

describe("space typed at the start of a wrapped word (trails the previous line)", () => {
  test("a space typed before a wrapped word stays trailing on the previous line", () => {
    const a = setup("aaaa bbbbb ccccc");
    // the inter-word space already trails line 0; line 1 begins flush with "ccccc"
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe("ccccc");

    a.cursor.setPosition(0, 1); // start of the wrapped word
    keyDown(a, " ");

    expect(a.text.value).toBe("aaaa bbbbb  ccccc");
    // the new space joins the trailing run on line 0; line 1 still starts flush
    expect(a.text.getLine(0)).toBe("aaaa bbbbb  ");
    expect(a.text.getLine(1)).toBe("ccccc");

    // the caret stays at the start of the wrapped word — the space collapsed
    // into the previous line's margin rather than pushing the word right.
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });

  test("no visual line's visible content exceeds the wrap width", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    keyDown(a, " ");
    keyDown(a, " ");
    keyDown(a, " ");
    for (let i = 0; i < a.text.noLines; i++) {
      expect(visibleLen(a.text.getLine(i))).toBeLessThanOrEqual(MAXLEN);
    }
  });

  test("a single wrap space on a full line trails it, never leading the next line", () => {
    const a = setup("aaaa bbbbb ccccc");
    // line 0 is exactly full; the single wrap space stays trailing there
    // (collapsed in the margin) and line 1 begins flush with "ccccc".
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe("ccccc");
    expect(a.text.noLines).toBe(2);
  });
});
