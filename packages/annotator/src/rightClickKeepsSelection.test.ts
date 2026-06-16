/**
 * #3092 — Right-clicking over a highlight must keep the selection so the context
 * menu opens over the highlighted text instead of collapsing it.
 *
 * Regression guard: `onMouseDown` used to run its selection logic for every
 * mouse button, so the right-button mousedown (which precedes the `contextmenu`
 * event) collapsed the existing selection to a caret before the menu appeared.
 * Only the primary (left) button should drive text selection.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

const selectWordBar = (a: Annotator) => {
  // Double-click inside "bar" (cols 4..7) to create a real multi-char selection.
  a.onMouseDoubleClick({
    offsetX: 5 * (a.charWidth / a.ratio),
    offsetY: 0.5 * (a.lineHeight / a.ratio),
    preventDefault: () => {},
  } as unknown as MouseEvent);
};

const mouseDown = (a: Annotator, button: number) =>
  a.onMouseDown({
    clientX: 0,
    clientY: 0,
    button,
    preventDefault: () => {},
  } as unknown as MouseEvent);

describe("right-click keeps the existing selection (#3092)", () => {
  test("right (secondary) mousedown does not collapse the selection", () => {
    const a = mk("foo bar baz");
    selectWordBar(a);
    expect(a.cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });

    mouseDown(a, 2); // right button — precedes the contextmenu event

    expect(a.cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
  });

  test("middle (auxiliary) mousedown does not collapse the selection", () => {
    const a = mk("foo bar baz");
    selectWordBar(a);

    mouseDown(a, 1); // middle button

    expect(a.cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
  });

  test("left (primary) mousedown still starts a fresh collapsed selection", () => {
    const a = mk("foo bar baz");
    selectWordBar(a);

    mouseDown(a, 0); // left button — normal selection behaviour preserved

    // A new selection begins at the click point, collapsing the old highlight.
    expect(a.cursor.selectStart).toEqual(a.cursor.selectEnd);
  });
});
