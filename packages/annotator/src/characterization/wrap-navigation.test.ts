/**
 * Characterization tests — wrap-boundary nav.
 *
 * Locks the CURRENT caret behavior at a soft-wrap boundary, where ONE document
 * offset corresponds to TWO distinct, reachable visual caret positions:
 *   - end of the wrapped visual line   e.g. (10,0)
 *   - start of the next visual line    e.g. (0,1)
 * i.e. the editor today preserves caret *affinity* across a soft wrap.
 *
 * This is the behavior any offset-model migration must either
 * preserve (with an affinity bit) or deliberately change — these tests make the
 * choice explicit instead of silent. They assert what the editor does today.
 */
import { Annotator } from "../lib/Annotator";
import { EditMode } from "../lib/constants";

const mk = (text: string, mode: EditMode = EditMode.RAW): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(mode);
  a.text.updateCharsAtLine(10); // force a soft wrap at column 10
  return a;
};
const key = (a: Annotator, k: string, mods: Partial<KeyboardEvent> = {}) =>
  a.keys.onKeyDown({
    key: k,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    code: "",
    preventDefault: () => {},
    ...mods,
  } as KeyboardEvent);
const pos = (a: Annotator) => ({ x: a.cursor.xLine, y: a.cursor.yLine });

// "supercalifragilistic" wraps to ["supercalif", "ragilistic"] at width 10.
const WRAPPED = "supercalifragilistic";

describe("characterization: caret affinity at a soft-wrap boundary", () => {
  test("the wrapped doc has two visual lines of 10", () => {
    const a = mk(WRAPPED);
    expect(a.text.segments[0].lines).toEqual(["supercalif", "ragilistic"]);
  });

  test("ArrowLeft from start of the next line lands at end of the wrapped line", () => {
    const a = mk(WRAPPED);
    a.cursor.setPosition(0, 1);
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 10, y: 0 }); // end-of-line position is reachable
  });

  test("a second ArrowLeft then steps one real char back", () => {
    const a = mk(WRAPPED);
    a.cursor.setPosition(0, 1);
    key(a, "ArrowLeft"); // (10,0)
    key(a, "ArrowLeft"); // (9,0)
    expect(pos(a)).toEqual({ x: 9, y: 0 });
  });

  test("ArrowRight from end of the wrapped line stops at the boundary first", () => {
    const a = mk(WRAPPED);
    a.cursor.setPosition(9, 0);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 10, y: 0 }); // pauses at end-of-line, not (0,1)
  });

  test("a second ArrowRight then moves to start of the next line", () => {
    const a = mk(WRAPPED);
    a.cursor.setPosition(9, 0);
    key(a, "ArrowRight"); // (10,0)
    key(a, "ArrowRight"); // (0,1)
    expect(pos(a)).toEqual({ x: 0, y: 1 });
  });

  test("the end-of-wrapped-line position (10,0) is itself a valid caret position", () => {
    const a = mk(WRAPPED);
    a.cursor.setPosition(10, 0);
    // it resolves to a real document position (raw index 10)...
    const seg = a.text.cursorToIndex(a.viewport, a.cursor);
    expect(seg).not.toBeNull();
    expect(seg!.rawTextIndex).toBe(10);
    // ...and ArrowLeft from it moves one real char back (not to (0,1)).
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 9, y: 0 });
  });
});
