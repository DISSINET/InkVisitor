/**
 * Characterization — how a non-extending (no-shift) arrow collapses an active
 * selection. Locks current behavior before the anchor/head selection migration.
 *
 * Horizontal arrows collapse to the NEAR EDGE without moving further; vertical
 * arrows move from the caret (head) and just clear the selection.
 */
import { Annotator } from "../lib/Annotator";
import { EditMode } from "../lib/constants";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
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

const DOC = "abcde\nfghij\nklmno";

const selectBCD = (a: Annotator) => {
  a.cursor.setPosition(1, 0);
  key(a, "ArrowRight", { shiftKey: true });
  key(a, "ArrowRight", { shiftKey: true }); // selection (1,0)-(3,0)
};

describe("characterization: non-shift arrow collapses an active selection", () => {
  test("ArrowRight collapses to the RIGHT edge without moving further", () => {
    const a = mk(DOC);
    selectBCD(a);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
    expect(a.cursor.getSelectedArea()).toBeNull();
  });

  test("ArrowLeft collapses to the LEFT edge without moving further", () => {
    const a = mk(DOC);
    selectBCD(a);
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
    expect(a.cursor.getSelectedArea()).toBeNull();
  });

  test("ArrowDown moves from the caret and clears the selection", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 0);
    key(a, "ArrowRight", { shiftKey: true }); // selection (1,0)-(2,0), caret (2,0)
    key(a, "ArrowDown");
    expect(pos(a)).toEqual({ x: 2, y: 1 });
    expect(a.cursor.getSelectedArea()).toBeNull();
  });

  test("ArrowUp moves from the caret and clears the selection", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 1);
    key(a, "ArrowRight", { shiftKey: true }); // selection (1,1)-(2,1), caret (2,1)
    key(a, "ArrowUp");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
    expect(a.cursor.getSelectedArea()).toBeNull();
  });
});
