import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  return canvas;
};

const EXAMPLE_TEXT =
  '<8bcbfeef-f973-4315-be40-d88f0edef980>\n' +
  "<83d3f594-4ade-48c1-9462-76f416bd9b31>\n" +
  "<cce14271-8fe8-49a6-8268-b223bb5d64f4>\n" +
  "\n" +
  'In <645bce7d-ecc7-49b4-9b3a-88eb22cf94d1 elvl="1">nomine  dasd da dasd asd dasdasdasdas   ' +
  '<e28f5da8-d49b-4d33-bd58-c9370cca0a13 elvl="1">' +
  '<97d48220-068d-4d35-8816-8e74ab1d7b6a elvl="1">Domini amen' +
  "</97d48220-068d-4d35-8816-8e74ab1d7b6a>" +
  "</645bce7d-ecc7-49b4-9b3a-88eb22cf94d1>" +
  ". Anno</e28f5da8-d49b-4d33-bd58-c9370cca0a13>" +
  " eiusdem millesimo ducentesimo nonagesimo primo, vigesimo nono die mensis madii.\n";

describe("word/tag selection with ctrl/alt arrow keys in RAW mode", () => {
  let annotator: Annotator;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    if (mockCanvas && mockCanvas.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
  });

  const moveCursorToAbsIndex = (absIndex: number) => {
    const pos = annotator.text.getSegmentFromAbsTextIndex(absIndex);
    expect(pos).not.toBeNull();
    const coords = annotator.text.positionToCursor(annotator.viewport, pos!);
    expect(coords).not.toBeNull();
    annotator.cursor.setPosition(coords!.xLine, coords!.yLine);
  };

  const getCursorAbsIndex = () =>
    annotator.text.getAbsTextIndex(
      annotator.cursor.getAbsolutePosition(annotator.viewport)
    );

  const getSelectedRawText = () => {
    const [start, end] = annotator.cursor.getAbsBounds();
    if (!start || !end) return "";
    const startIndex = annotator.text.getAbsTextIndex(start);
    const endIndex = annotator.text.getAbsTextIndex(end);
    return annotator.text.value.slice(startIndex, endIndex);
  };

  describe("shift+alt+ArrowRight", () => {
    test("selects a full XML tag when cursor is just before it", () => {
      annotator = new Annotator(mockCanvas, EXAMPLE_TEXT);
      annotator.setMode(EditMode.RAW);

      const tag = '<e28f5da8-d49b-4d33-bd58-c9370cca0a13 elvl="1">';
      const tagIndex = annotator.text.value.indexOf(tag);
      moveCursorToAbsIndex(tagIndex);

      annotator.keys.onArrowRight({ altKey: true, shiftKey: true });

      expect(getSelectedRawText()).toBe(tag);
    });

    test("selects a content word when cursor is at its start", () => {
      const text = "hello world";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(0);

      annotator.keys.onArrowRight({ altKey: true, shiftKey: true });

      expect(getSelectedRawText()).toBe("hello");
    });

    test("selects remaining part of word when cursor is in the middle", () => {
      const text = "hello world";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(2);

      annotator.keys.onArrowRight({ altKey: true, shiftKey: true });

      expect(getSelectedRawText()).toBe("llo");
    });
  });

  describe("shift+alt+ArrowLeft", () => {
    test("selects a full XML tag when cursor is just after it", () => {
      annotator = new Annotator(mockCanvas, EXAMPLE_TEXT);
      annotator.setMode(EditMode.RAW);

      const tag = '<e28f5da8-d49b-4d33-bd58-c9370cca0a13 elvl="1">';
      const tagIndex = annotator.text.value.indexOf(tag);
      moveCursorToAbsIndex(tagIndex + tag.length);

      annotator.keys.onArrowLeft({ altKey: true, shiftKey: true });

      expect(getSelectedRawText()).toBe(tag);
    });

    test("selects a content word when cursor is at its end", () => {
      const text = "hello world";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(5);

      annotator.keys.onArrowLeft({ altKey: true, shiftKey: true });

      expect(getSelectedRawText()).toBe("hello");
    });
  });

  describe("ctrl+ArrowRight movement (no shift)", () => {
    test("jumps to the end of the current word", () => {
      const text = "first second";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(0);
      annotator.keys.onArrowRight({ ctrlKey: true });

      expect(getCursorAbsIndex()).toBe(5);
    });

    test("stops at line boundary when at end of line", () => {
      const text = "first\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(5);
      annotator.keys.onArrowRight({ ctrlKey: true });

      expect(getCursorAbsIndex()).toBe(6);
    });

    test("stops at line boundary on empty line", () => {
      const text = "first\n\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(5);
      annotator.keys.onArrowRight({ ctrlKey: true });
      const afterFirstJump = getCursorAbsIndex();

      annotator.keys.onArrowRight({ ctrlKey: true });
      const afterSecondJump = getCursorAbsIndex();

      expect(afterFirstJump).toBe(6);
      expect(afterSecondJump).toBe(7);
    });
  });

  describe("ctrl+ArrowLeft movement (no shift)", () => {
    test("jumps to the start of the current word", () => {
      const text = "first second";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(11);
      annotator.keys.onArrowLeft({ ctrlKey: true });

      expect(getCursorAbsIndex()).toBe(6);
    });

    test("stops at line boundary when at start of line", () => {
      const text = "first\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(6);
      annotator.keys.onArrowLeft({ ctrlKey: true });

      expect(getCursorAbsIndex()).toBe(5);
    });

    test("stops at line boundary on empty line", () => {
      const text = "first\n\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(7);
      annotator.keys.onArrowLeft({ ctrlKey: true });
      const afterFirstJump = getCursorAbsIndex();

      annotator.keys.onArrowLeft({ ctrlKey: true });
      const afterSecondJump = getCursorAbsIndex();

      expect(afterFirstJump).toBe(6);
      expect(afterSecondJump).toBe(5);
    });
  });

  describe("line boundary with shift selection", () => {
    test("shift+alt+ArrowRight across line boundary creates valid selection", () => {
      const text = "first\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(5);
      annotator.keys.onArrowRight({ altKey: true, shiftKey: true });

      const [start, end] = annotator.cursor.getAbsBounds();
      expect(start).toBeDefined();
      expect(end).toBeDefined();
      expect(start!.yLine).not.toBe(end!.yLine);
    });

    test("shift+alt+ArrowLeft across line boundary creates valid selection", () => {
      const text = "first\nsecond";
      annotator = new Annotator(mockCanvas, text);
      annotator.setMode(EditMode.RAW);

      moveCursorToAbsIndex(6);
      annotator.keys.onArrowLeft({ altKey: true, shiftKey: true });

      const [start, end] = annotator.cursor.getAbsBounds();
      expect(start).toBeDefined();
      expect(end).toBeDefined();
      expect(start!.yLine).not.toBe(end!.yLine);
    });
  });
});
