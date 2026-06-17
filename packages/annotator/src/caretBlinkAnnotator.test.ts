/**
 * #3092 — Annotator wiring of the blinking caret.
 *
 * The blink timer runs only while a collapsed caret is actually shown, repaints
 * on each toggle, re-solidifies on user activity, and is torn down by destroy().
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  c.tabIndex = 0;
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

const focusCanvas = (a: Annotator) => {
  a.element.focus();
  a.element.dispatchEvent(new FocusEvent("focus"));
};

const placeCaret = (a: Annotator) => {
  focusCanvas(a);
  a.cursor.setPosition(0, 0);
  a.draw(); // starts the blink timer for the now-visible caret
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("annotator caret blink (#3092)", () => {
  test("caret visibility toggles once per second while a caret is shown", () => {
    const a = mk("foo bar baz");
    placeCaret(a);

    expect(a.isCaretVisible()).toBe(true);
    jest.advanceTimersByTime(500);
    expect(a.isCaretVisible()).toBe(false);
    jest.advanceTimersByTime(500);
    expect(a.isCaretVisible()).toBe(true);
  });

  test("caret does not blink while the canvas is not focused", () => {
    const a = mk("foo bar baz");
    a.cursor.setPosition(0, 0);
    a.draw();

    expect(a.isCaretVisible()).toBe(true);
    jest.advanceTimersByTime(2000);
    expect(a.isCaretVisible()).toBe(true);
  });

  test("caret does not blink while a selection is active", () => {
    const a = mk("foo bar baz");
    // Double-click selects the word "bar" (cols 4..7) — a real selection.
    a.onMouseDoubleClick({
      offsetX: 5 * (a.charWidth / a.ratio),
      offsetY: 0.5 * (a.lineHeight / a.ratio),
      preventDefault: () => {},
    } as unknown as MouseEvent);
    a.draw();

    expect(a.isCaretVisible()).toBe(true);
    jest.advanceTimersByTime(2000);
    expect(a.isCaretVisible()).toBe(true); // never toggled off
  });

  test("the caret is not painted during the hidden phase", () => {
    const a = mk("foo bar baz");
    placeCaret(a);
    const drawLineSpy = jest.spyOn(a.cursor, "drawLine");

    a.draw(); // visible phase → caret painted
    expect(drawLineSpy).toHaveBeenCalled();

    jest.advanceTimersByTime(500); // → hidden phase
    expect(a.isCaretVisible()).toBe(false);
    drawLineSpy.mockClear();
    a.draw();
    expect(drawLineSpy).not.toHaveBeenCalled();
  });

  test("a left click re-solidifies the caret", () => {
    const a = mk("foo bar baz");
    placeCaret(a);
    jest.advanceTimersByTime(500);
    expect(a.isCaretVisible()).toBe(false);

    a.onMouseDown({
      clientX: 0,
      clientY: 0,
      button: 0,
      preventDefault: () => {},
    } as unknown as MouseEvent);

    expect(a.isCaretVisible()).toBe(true);
  });

  test("a keystroke re-solidifies the caret", () => {
    const a = mk("foo bar baz");
    placeCaret(a);
    jest.advanceTimersByTime(500);
    expect(a.isCaretVisible()).toBe(false);

    a.keys.onKeyDown({
      key: "ArrowRight",
      code: "ArrowRight",
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      preventDefault: () => {},
    } as unknown as KeyboardEvent);

    expect(a.isCaretVisible()).toBe(true);
  });

  test("blink repaints do not fire the host selection callback", () => {
    const a = mk("foo bar baz");
    jest.runOnlyPendingTimers(); // flush the constructor's deferred resize()/draw()
    focusCanvas(a);
    a.cursor.setPosition(0, 0);

    const onSelect = jest.fn();
    a.onSelectText(onSelect);

    a.draw(); // a real (interaction) draw still notifies the host
    expect(onSelect).toHaveBeenCalled();

    onSelect.mockClear();
    jest.advanceTimersByTime(2000); // ~4 blink toggles — passive repaints only
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("destroy() stops the blink for good (a later draw cannot revive it)", () => {
    const a = mk("foo bar baz");
    placeCaret(a);
    jest.advanceTimersByTime(500);
    expect(a.isCaretVisible()).toBe(false);

    a.destroy();
    expect(a.isCaretVisible()).toBe(true); // frozen solid

    // Even if something repaints later (e.g. the constructor's deferred resize),
    // the caret must not start blinking again.
    a.draw();
    jest.advanceTimersByTime(2000);
    expect(a.isCaretVisible()).toBe(true);
  });

  test("a second constructor on the same canvas tears down the first instance", () => {
    const c = document.createElement("canvas");
    c.style.width = "800px";
    c.style.height = "600px";

    const a1 = new Annotator(c, "hello");
    a1.setMode(EditMode.RAW);
    jest.runOnlyPendingTimers();
    placeCaret(a1);

    const drawSpy = jest.spyOn(a1, "draw");
    const a2 = new Annotator(c, "world");
    a2.setMode(EditMode.RAW);
    jest.runOnlyPendingTimers();

    jest.advanceTimersByTime(2000);
    expect(drawSpy).not.toHaveBeenCalled();

    a2.destroy();
  });

  test("a second addScroller on the same element stops the previous owner from updating it", () => {
    const c = document.createElement("canvas");
    c.style.width = "800px";
    c.style.height = "600px";
    const scrollerDiv = document.createElement("div");
    scrollerDiv.style.height = "400px";
    scrollerDiv.innerHTML = "<div></div>";

    const manyLines = Array.from({ length: 80 }, (_, i) => `line ${i}`).join(
      "\n"
    );
    const a1 = new Annotator(c, manyLines);
    a1.setMode(EditMode.RAW);
    a1.addScroller(scrollerDiv);
    a1.scrollToLine(40);
    jest.runOnlyPendingTimers();

    const updateSpy = jest.spyOn(a1.scroller!, "update");

    const a2 = new Annotator(c, manyLines);
    a2.setMode(EditMode.RAW);
    a2.addScroller(scrollerDiv);
    jest.runOnlyPendingTimers();

    jest.advanceTimersByTime(2000);
    expect(updateSpy).not.toHaveBeenCalled();

    a2.destroy();
  });
});
