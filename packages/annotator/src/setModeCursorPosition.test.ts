import { Annotator } from './lib/Annotator';
import { EditMode } from './lib/constants';

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.style.width = '800px';
  canvas.style.height = '600px';
  return canvas;
};

function getCursorAbsIndex(annotator: Annotator): number {
  const seg = annotator.text.cursorToIndex(annotator.viewport, annotator.cursor);
  if (!seg) return -1;
  return annotator.text.getAbsTextIndexFromPosition(seg);
}

describe('setMode cursor position', () => {
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

  test('preserves cursor position when switching from raw to highlight', () => {
    annotator = new Annotator(mockCanvas, '<p>Hello world</p>');
    annotator.setMode(EditMode.RAW);
    annotator.cursor.setPosition(5, 0);
    annotator.viewport.lineStart = 0;
    const absBefore = getCursorAbsIndex(annotator);
    expect(absBefore).toBeGreaterThanOrEqual(0);

    annotator.setMode(EditMode.HIGHLIGHT);

    const absAfter = getCursorAbsIndex(annotator);
    expect(absAfter).toBe(absBefore);
  });

  test('preserves cursor position when switching from highlight to raw', () => {
    annotator = new Annotator(mockCanvas, '<p>Hello world</p>');
    annotator.setMode(EditMode.HIGHLIGHT);
    annotator.cursor.setPosition(5, 0);
    annotator.viewport.lineStart = 0;
    const absBefore = getCursorAbsIndex(annotator);
    expect(absBefore).toBeGreaterThanOrEqual(0);

    annotator.setMode(EditMode.RAW);

    const absAfter = getCursorAbsIndex(annotator);
    expect(absAfter).toBe(absBefore);
  });

  test('preserves cursor position when switching highlight to raw with multi-line content', () => {
    const text = '<p>First line here</p>\n<p>Second line</p>\n<p>Third</p>';
    annotator = new Annotator(mockCanvas, text);
    annotator.setMode(EditMode.HIGHLIGHT);
    annotator.viewport.lineStart = 0;
    annotator.cursor.setPosition(3, 1);
    const absBefore = getCursorAbsIndex(annotator);
    expect(absBefore).toBeGreaterThanOrEqual(0);

    annotator.setMode(EditMode.RAW);

    expect(annotator.cursor.xLine).toBeGreaterThanOrEqual(0);
    expect(annotator.cursor.yLine).toBeGreaterThanOrEqual(0);
    const absAfter = getCursorAbsIndex(annotator);
    expect(absAfter).toBe(absBefore);
  });

  test('preserves cursor before " dfsd" when switching raw to parsed with malformed tag', () => {
    const text = 'ad asdadas<first><test>fdsds </test></first elvl="1"> dfsd  ';
    annotator = new Annotator(mockCanvas, text);
    annotator.setMode(EditMode.RAW);
    const targetRawIndex = text.indexOf('> ') + 1;
    const segPos = annotator.text.getSegmentFromAbsTextIndex(targetRawIndex);
    expect(segPos).not.toBeNull();
    const coords = annotator.text.positionToCursor(annotator.viewport, segPos!);
    expect(coords).not.toBeNull();
    annotator.cursor.setPosition(coords!.xLine, coords!.yLine);
    const absBefore = getCursorAbsIndex(annotator);
    expect(absBefore).toBe(targetRawIndex);

    annotator.setMode(EditMode.HIGHLIGHT);

    const seg = annotator.text.cursorToIndex(annotator.viewport, annotator.cursor);
    expect(seg).not.toBeNull();
    const parsed = annotator.text.segments[seg!.segmentIndex].parsed;
    expect(parsed.slice(seg!.parsedTextIndex, seg!.parsedTextIndex + 5)).toBe(' dfsd');
  });
});
