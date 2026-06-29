import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

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

/** Capture the x of every fillRect the cursor draws. */
function drawCaretX(a: Annotator, charWidth: number): number[] {
  const calls: number[] = [];
  const ctx = {
    fillStyle: "",
    globalAlpha: 1,
    globalCompositeOperation: "",
    fillRect: (x: number) => calls.push(x),
  } as unknown as CanvasRenderingContext2D;
  a.cursor.draw(ctx, a.viewport, a.text, {
    lineHeight: 16,
    charWidth,
    charsAtLine: MAXLEN,
    caretWidth: 1,
    caretVisible: true,
  });
  return calls;
}

describe("caret render clamp keeps the caret inside the viewport (#3145)", () => {
  test("a caret past the viewport width is clamped to the right margin", () => {
    // defensive: any path placing the caret past the edge must still draw it
    // in-bounds rather than off-screen
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(MAXLEN + 5, 0); // caret column well past the viewport

    const charWidth = 8;
    const xs = drawCaretX(a, charWidth);
    expect(xs.length).toBe(1);
    // the caret must be painted within the viewport, not past the right margin
    expect(xs[0]).toBeLessThanOrEqual(MAXLEN * charWidth);
  });

  test("a normal short-line caret is unaffected by the clamp", () => {
    const a = setup("hi");
    a.cursor.setPosition(2, 0); // end of "hi"
    const charWidth = 8;
    const xs = drawCaretX(a, charWidth);
    expect(xs.length).toBe(1);
    expect(xs[0]).toBe(2 * charWidth); // exact column, not clamped
  });
});
