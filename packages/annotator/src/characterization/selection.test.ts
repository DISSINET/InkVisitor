/**
 * Characterization tests for selection.
 *
 * These lock the CURRENT selection behavior of the annotator as a safety net
 * before the cursor-model refactor.
 * They assert what the editor does today, not necessarily what is "ideal" — if a
 * value looks wrong, that is a separate bug to file, not something to change here.
 *
 * Each case records: the resulting caret, selectStart/selectEnd (raw, unordered),
 * the document-ordered getSelectedArea(), and the extracted range text.
 */
import { Annotator } from "../lib/Annotator";
import { DIRECTION } from "../lib/Cursor";
import { EditMode } from "../lib/constants";

const mk = (text: string, mode: EditMode = EditMode.RAW): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(mode);
  return a;
};
const key = (a: Annotator, k: string, mods: Partial<KeyboardEvent> = {}) =>
  a.keys.onKeyDown({
    key: k,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
    ...mods,
  } as KeyboardEvent);

const pos = (a: Annotator) => ({ x: a.cursor.xLine, y: a.cursor.yLine });
const selText = (a: Annotator): string | null => {
  const [s, e] = a.cursor.getAbsBounds();
  if (!s || !e) return null;
  return a.text.getRangeText(s, e);
};

const DOC = "abcde\nfghij\nklmno"; // 3 lines, each 5 chars

describe("characterization: Shift+Arrow horizontal extend/shrink", () => {
  test("Shift+ArrowRight extends the selection forward by one char", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 0);
    key(a, "ArrowRight", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 1, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.FORWARD);
    expect(selText(a)).toBe("b");
  });

  test("Shift+ArrowRight twice extends to two chars", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 0);
    key(a, "ArrowRight", { shiftKey: true });
    key(a, "ArrowRight", { shiftKey: true });
    expect(a.cursor.selectStart).toEqual({ xLine: 1, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 3, yLine: 0 });
    expect(selText(a)).toBe("bc");
  });

  test("Shift+ArrowLeft after extending right shrinks the selection", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 0);
    key(a, "ArrowRight", { shiftKey: true });
    key(a, "ArrowRight", { shiftKey: true });
    key(a, "ArrowLeft", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 1, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 0 });
    expect(selText(a)).toBe("b");
  });

  test("Shift+ArrowLeft extends the selection backward", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 0);
    key(a, "ArrowLeft", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 3, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.BACKWARD);
    expect(a.cursor.getSelectedArea()).toEqual([
      { xLine: 2, yLine: 0 },
      { xLine: 3, yLine: 0 },
    ]);
    expect(selText(a)).toBe("c");
  });

  test("crossing the anchor flips the selection direction", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowRight", { shiftKey: true }); // forward to (3,0)
    key(a, "ArrowLeft", { shiftKey: true }); // collapse back to (2,0)
    key(a, "ArrowLeft", { shiftKey: true }); // now backward to (1,0)
    expect(pos(a)).toEqual({ x: 1, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 1, yLine: 0 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.BACKWARD);
    expect(selText(a)).toBe("b");
  });
});

describe("characterization: Shift+Arrow vertical extend/shrink", () => {
  test("Shift+ArrowDown extends across the line break", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowDown", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 1 });
    expect(a.cursor.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 1 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.FORWARD);
    expect(selText(a)).toBe("cde\nfg");
  });

  test("Shift+ArrowUp extends backward across the line break", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 1);
    key(a, "ArrowUp", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 2, yLine: 1 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.BACKWARD);
    expect(a.cursor.getSelectedArea()).toEqual([
      { xLine: 2, yLine: 0 },
      { xLine: 2, yLine: 1 },
    ]);
    expect(selText(a)).toBe("cde\nfg");
  });

  test("Shift+ArrowUp shrinks a downward selection back one line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowDown", { shiftKey: true });
    key(a, "ArrowDown", { shiftKey: true });
    key(a, "ArrowUp", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 2, y: 1 });
    expect(a.cursor.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 1 });
    expect(selText(a)).toBe("cde\nfg");
  });
});

describe("characterization: Shift+Home / Shift+End", () => {
  test("Shift+End selects from the caret to end of line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(1, 1);
    key(a, "End", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 5, y: 1 });
    expect(a.cursor.selectStart).toEqual({ xLine: 1, yLine: 1 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 5, yLine: 1 });
    expect(selText(a)).toBe("ghij");
  });

  test("Shift+Home selects from the caret back to start of line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "Home", { shiftKey: true });
    expect(pos(a)).toEqual({ x: 0, y: 1 });
    expect(a.cursor.selectStart).toEqual({ xLine: 3, yLine: 1 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 0, yLine: 1 });
    expect(a.cursor.getSelectedArea()).toEqual([
      { xLine: 0, yLine: 1 },
      { xLine: 3, yLine: 1 },
    ]);
    expect(selText(a)).toBe("fgh");
  });
});

describe("characterization: Cmd+Shift+Up / Cmd+Shift+Down", () => {
  test("Cmd+Shift+Down selects from the caret to document end", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowDown", { metaKey: true, shiftKey: true });
    expect(pos(a)).toEqual({ x: 5, y: 2 });
    expect(a.cursor.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 5, yLine: 2 });
    expect(selText(a)).toBe("cde\nfghij\nklmno");
  });

  test("Cmd+Shift+Up selects from the caret to document start", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 2);
    key(a, "ArrowUp", { metaKey: true, shiftKey: true });
    expect(pos(a)).toEqual({ x: 0, y: 0 });
    expect(a.cursor.selectStart).toEqual({ xLine: 0, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 2 });
    expect(selText(a)).toBe("abcde\nfghij\nkl");
  });
});

describe("characterization: select-all (Ctrl+A)", () => {
  test("Ctrl+A selects the whole document", () => {
    const a = mk(DOC);
    key(a, "a", { ctrlKey: true });
    expect(a.cursor.selectStart).toEqual({ xLine: 0, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 5, yLine: 2 });
    expect(selText(a)).toBe("abcde\nfghij\nklmno");
  });
});

describe("characterization: double-click word selection", () => {
  test("double-click inside a word selects that word", () => {
    const a = mk("foo bar baz");
    // Click roughly in the middle of "bar" (chars 4..7). Map a char column to
    // a canvas offsetX through the current charWidth/ratio.
    const col = 5;
    const evt = {
      offsetX: col * (a.charWidth / a.ratio),
      offsetY: 0.5 * (a.lineHeight / a.ratio),
      preventDefault: () => {},
    } as unknown as MouseEvent;
    a.onMouseDoubleClick(evt);
    expect(a.cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
    expect(a.cursor.selectDirection).toBe(DIRECTION.FORWARD);
    expect(selText(a)).toBe("bar");
  });
});

describe("characterization: selection in HIGHLIGHT mode", () => {
  test("Shift+ArrowRight extends a selection in HIGHLIGHT mode", () => {
    const a = mk(DOC, EditMode.HIGHLIGHT);
    a.cursor.setPosition(1, 0);
    key(a, "ArrowRight", { shiftKey: true });
    expect(a.cursor.selectStart).toEqual({ xLine: 1, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 2, yLine: 0 });
    expect(selText(a)).toBe("b");
  });
});
