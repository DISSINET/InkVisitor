import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  return canvas;
};

function keyDown(
  annotator: Annotator,
  key: string,
  options: { shiftKey?: boolean } = {}
) {
  annotator.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: options.shiftKey ?? false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent);
}

describe("PageUp / PageDown keys", () => {
  let annotator: Annotator;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
    annotator = new Annotator(mockCanvas, "");
    annotator.setMode(EditMode.RAW);
    const lineCount = annotator.viewport.noLines * 4;
    annotator.onReplaceText(
      Array.from({ length: lineCount }, (_, i) => `line${i}`).join("\n")
    );
    annotator.cursor.setPosition(0, lineCount - 1);
    annotator.viewport.scrollTo(
      lineCount - annotator.viewport.noLines,
      annotator.scrollExtentLineCount()
    );
  });

  afterEach(() => {
    if (mockCanvas?.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
  });

  test("PageUp moves caret up by one viewport page", () => {
    const startY = annotator.cursor.yLine;
    const pageStep = annotator.viewport.noLines;

    keyDown(annotator, "PageUp");

    expect(annotator.cursor.yLine).toBe(
      Math.max(0, startY - pageStep)
    );
    expect(annotator.cursor.selectStart).toBeUndefined();
    expect(annotator.cursor.selectEnd).toBeUndefined();
  });

  test("PageDown moves caret down by one viewport page", () => {
    annotator.cursor.setPosition(0, 0);
    annotator.viewport.lineStart = 0;
    const pageStep = annotator.viewport.noLines;

    keyDown(annotator, "PageDown");

    expect(annotator.cursor.yLine).toBe(
      Math.min(annotator.text.noLines - 1, pageStep)
    );
  });

  test("Shift+PageUp selects while moving caret up one page", () => {
    const startY = annotator.cursor.yLine;
    const startX = annotator.cursor.xLine;
    const pageStep = annotator.viewport.noLines;

    keyDown(annotator, "PageUp", { shiftKey: true });

    expect(annotator.cursor.yLine).toBe(Math.max(0, startY - pageStep));
    expect(annotator.cursor.selectStart).toEqual({
      xLine: startX,
      yLine: startY,
    });
    expect(annotator.cursor.selectEnd).toEqual({
      xLine: annotator.cursor.xLine,
      yLine: annotator.cursor.yLine,
    });
    expect(annotator.cursor.isSelected()).toBe(true);
  });

  test("Shift+PageDown extends selection across repeated page moves", () => {
    annotator.cursor.setPosition(2, 0);
    annotator.viewport.lineStart = 0;

    keyDown(annotator, "PageDown", { shiftKey: true });
    const endAfterFirst = { ...annotator.cursor.selectEnd! };

    keyDown(annotator, "PageDown", { shiftKey: true });

    expect(annotator.cursor.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(annotator.cursor.selectEnd!.yLine).toBeGreaterThan(
      endAfterFirst.yLine
    );
    expect(annotator.cursor.isSelected()).toBe(true);
  });
});
