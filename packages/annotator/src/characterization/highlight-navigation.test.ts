/**
 * Characterization — HIGHLIGHT-mode caret navigation across hidden tag markup.
 *
 * Locks the CURRENT behavior before the full offset-model migration replaces the
 * legacy visual nav path. In HIGHLIGHT the caret moves by VISIBLE (parsed)
 * column; the underlying raw offset jumps over hidden `<tag>` markup. The
 * migration must preserve exactly these visible movements.
 */
import { Annotator } from "../lib/Annotator";
import { EditMode } from "../lib/constants";

const mk = (text: string, w = 100): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.HIGHLIGHT);
  a.text.updateCharsAtLine(w);
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

const TAGGED = "ab<x>hello</x>cd"; // parsed: "abhellocd" (9 visible chars)

describe("characterization: HIGHLIGHT navigation over hidden markup", () => {
  test("parsed line strips the tags", () => {
    const a = mk(TAGGED);
    expect(a.text.segments[0].lines).toEqual(["abhellocd"]);
  });

  test("ArrowRight advances one visible column at a time and stops at EOL", () => {
    const a = mk(TAGGED);
    a.cursor.setPosition(0, 0);
    const seq: number[] = [];
    for (let i = 0; i < 10; i++) {
      seq.push(a.cursor.xLine);
      key(a, "ArrowRight");
    }
    seq.push(a.cursor.xLine);
    expect(seq).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9]);
  });

  test("ArrowLeft retreats one visible column at a time and stops at BOL", () => {
    const a = mk(TAGGED);
    a.cursor.setPosition(9, 0);
    const seq: number[] = [];
    for (let i = 0; i < 10; i++) {
      seq.push(a.cursor.xLine);
      key(a, "ArrowLeft");
    }
    seq.push(a.cursor.xLine);
    expect(seq).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]);
  });

  test("the visible caret column maps to a raw offset that skips markup", () => {
    const a = mk(TAGGED);
    // col 1 -> raw 1 (after "ab"=a..b? offset of 'b'), col 2 jumps over "<x>"
    expect(a.text.offsetFromVisual(1, 0)).toBe(1);
    expect(a.text.offsetFromVisual(2, 0)).toBe(5); // skipped "<x>"
    expect(a.text.offsetFromVisual(6, 0)).toBe(9);
    expect(a.text.offsetFromVisual(7, 0)).toBe(14); // skipped "</x>"
  });

  test("crossing a hard newline between segments", () => {
    const a = mk("ab<x>hi</x>\ncd"); // parsed segments: "abhi", "cd"
    expect(a.text.segments.map((s) => s.lines)).toEqual([["abhi"], ["cd"]]);
    a.cursor.setPosition(4, 0); // end of "abhi"
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 0, y: 1 });
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 1, y: 1 });
    a.cursor.setPosition(0, 1);
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 4, y: 0 });
  });
});
