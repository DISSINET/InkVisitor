import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

function keyDown(a: Annotator, key: string, shiftKey = false) {
  a.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey,
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

// A soft-wrap boundary is one offset with two visual positions (end of line N,
// start of line N+1). Plain Left/Right cross to the far side; shift+Left/Right
// skip that flip so the selection actually grows by a char (#3145).
describe("ArrowLeft at a soft-wrap boundary (#3145)", () => {
  test("plain Left from a continuation line start lands AFTER the last char of the previous line", () => {
    const a = setup("aaaa bbbbb ccccc");
    expect(a.text.getLine(0)).toBe("aaaa bbbbb");
    expect(a.text.getLine(1)).toBe(" ccccc");

    a.cursor.setPosition(0, 1); // leftmost of the continuation line
    keyDown(a, "ArrowLeft");

    // caret sits just after the last character of the previous line, at the
    // right margin, and stays within the viewport (visible, not off-screen)
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(a.text.getLine(0).length); // 10 = after last char
    expect(a.cursor.xLine).toBeLessThanOrEqual(MAXLEN);
  });

  test("a second plain Left then steps into the previous line content", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    keyDown(a, "ArrowLeft"); // (10,0) after the last char
    keyDown(a, "ArrowLeft"); // (9,0) into the content
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(9);
  });

  test("a normal left move (not at a boundary) still steps exactly one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(3, 0); // inside "aaaa"
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(3);
    keyDown(a, "ArrowLeft");
    expect(a.cursor.head).toBe(2);
  });

  test("shift+Left from a continuation start extends the selection by one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10);
    keyDown(a, "ArrowLeft", true);
    // shift skips the affinity flip so the selection actually grows by one char
    expect(a.cursor.head).toBe(9);
    expect(a.cursor.isSelected()).toBe(true);
  });

  test("at document start ArrowLeft stays put", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 0);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    keyDown(a, "ArrowLeft");
    expect(a.cursor.head).toBe(0);
  });
});

describe("ArrowRight at a soft-wrap boundary, symmetric to ArrowLeft (#3145)", () => {
  test("plain Right from a wrapped line end lands at the start of the next line", () => {
    const a = setup("aaaa bbbbb ccccc");
    expect(a.text.getLine(0)).toBe("aaaa bbbbb");
    expect(a.text.getLine(1)).toBe(" ccccc");

    a.cursor.setPosition(MAXLEN, 0); // end of line 0 (after its last char)
    keyDown(a, "ArrowRight");

    // mirror of plain Left: it lands just before the first char of the next line
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });

  test("a second plain Right then steps into the next line content", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(MAXLEN, 0);
    keyDown(a, "ArrowRight"); // (0,1) start of next line
    keyDown(a, "ArrowRight"); // (1,1) into the content
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("shift+Right from a wrapped line end extends the selection by one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(MAXLEN, 0);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10);
    keyDown(a, "ArrowRight", true);
    // shift skips the affinity flip so the selection actually grows by one char
    expect(a.cursor.head).toBe(11);
    expect(a.cursor.isSelected()).toBe(true);
  });

  test("a normal right move (not at a boundary) still steps exactly one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(2, 0); // inside "aaaa"
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(2);
    keyDown(a, "ArrowRight");
    expect(a.cursor.head).toBe(3);
  });
});
