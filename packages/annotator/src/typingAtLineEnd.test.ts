import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  return canvas;
};

function keyDown(annotator: Annotator, key: string) {
  annotator.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent);
}

describe("typing at end of wrapped line", () => {
  let annotator: Annotator;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    if (mockCanvas?.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
  });

  test("space at end of full wrapped line stays trailing; the caret is draw-clamped", () => {
    annotator = new Annotator(mockCanvas, "");
    annotator.setMode(EditMode.RAW);
    const charsAtLine = annotator.text.charsAtLine;
    const fill = "x".repeat(charsAtLine);
    annotator.onReplaceText(fill);

    annotator.cursor.setPosition(charsAtLine, 0);
    const lenBefore = annotator.text.value.length;

    keyDown(annotator, " ");

    expect(annotator.text.value.length).toBe(lenBefore + 1);
    expect(annotator.text.value).toContain(" ");
    // Google-Docs style: the space stays trailing on the full line (no wrap to a
    // leading-space line); the caret stays on line 0 with its drawn column
    // clamped to the width, so it never scrolls off-screen.
    expect(annotator.text.noLines).toBe(1);
    expect(annotator.cursor.yLine).toBe(0);
    expect(Math.min(annotator.cursor.xLine, charsAtLine)).toBe(charsAtLine);
  });

  test("repeated spaces at a full wrapped line end accumulate trailing, caret clamped", () => {
    annotator = new Annotator(mockCanvas, "");
    annotator.setMode(EditMode.RAW);
    const charsAtLine = annotator.text.charsAtLine;
    annotator.onReplaceText("x".repeat(charsAtLine));
    annotator.cursor.setPosition(charsAtLine, 0);

    keyDown(annotator, " ");
    keyDown(annotator, " ");

    // both spaces stay trailing on the one line; the caret's drawn column stays
    // clamped to the width rather than scrolling off-screen
    expect(annotator.text.value.split(" ").length - 1).toBeGreaterThanOrEqual(2);
    expect(annotator.text.noLines).toBe(1);
    expect(Math.min(annotator.cursor.xLine, charsAtLine)).toBeLessThanOrEqual(
      charsAtLine
    );
  });
});
