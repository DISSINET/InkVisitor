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

  test("space at end of full wrapped line advances cursor to next line", () => {
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
    expect(annotator.cursor.yLine).toBe(1);
    expect(annotator.cursor.xLine).toBe(1);
  });

  test("repeated spaces at wrapped line end keep advancing", () => {
    annotator = new Annotator(mockCanvas, "");
    annotator.setMode(EditMode.RAW);
    const charsAtLine = annotator.text.charsAtLine;
    annotator.onReplaceText("x".repeat(charsAtLine));
    annotator.cursor.setPosition(charsAtLine, 0);

    keyDown(annotator, " ");
    keyDown(annotator, " ");

    expect(annotator.cursor.yLine).toBeGreaterThanOrEqual(1);
    expect(annotator.text.value.split(" ").length - 1).toBeGreaterThanOrEqual(2);
  });
});
