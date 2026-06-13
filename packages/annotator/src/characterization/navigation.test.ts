/**
 * Characterization tests — Phase 2, Task 2.1 (navigation).
 *
 * These lock the CURRENT caret-navigation behavior of the annotator as a safety
 * net before the cursor-model refactor (see packages/annotator/BASIC_EDITOR_BACKLOG.md).
 * They assert what the editor does today, not necessarily what is "ideal" — if a
 * value looks wrong, that is a separate bug to file, not something to change here.
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

const DOC = "abcde\nfghij\nklmno"; // 3 lines, each 5 chars

describe("characterization: ArrowLeft / ArrowRight", () => {
  test("ArrowRight mid-line advances the column", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });

  test("ArrowRight at end of a non-last line goes to start of next line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(5, 0);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 0, y: 1 });
  });

  test("ArrowRight at end of document stays put", () => {
    const a = mk(DOC);
    a.cursor.setPosition(5, 2);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 5, y: 2 });
  });

  test("ArrowLeft at start of a non-first line goes to end of previous line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(0, 1);
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 5, y: 0 });
  });

  test("ArrowLeft at document start stays put", () => {
    const a = mk(DOC);
    a.cursor.setPosition(0, 0);
    key(a, "ArrowLeft");
    expect(pos(a)).toEqual({ x: 0, y: 0 });
  });
});

describe("characterization: ArrowUp / ArrowDown", () => {
  test("ArrowDown keeps the column", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowDown");
    expect(pos(a)).toEqual({ x: 2, y: 1 });
  });

  test("ArrowUp keeps the column", () => {
    const a = mk(DOC);
    a.cursor.setPosition(2, 1);
    key(a, "ArrowUp");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });
});

describe("characterization: Home / End", () => {
  test("Home goes to column 0 of the current line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "Home");
    expect(pos(a)).toEqual({ x: 0, y: 1 });
  });

  test("End goes to the end of the current line", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "End");
    expect(pos(a)).toEqual({ x: 5, y: 1 });
  });

  test("Ctrl+Home goes to document start", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "Home", { ctrlKey: true });
    expect(pos(a)).toEqual({ x: 0, y: 0 });
  });

  test("Ctrl+End goes to document end", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "End", { ctrlKey: true });
    expect(pos(a)).toEqual({ x: 5, y: 2 });
  });
});

describe("characterization: Cmd document jumps", () => {
  test("Cmd+Up goes to document start", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "ArrowUp", { metaKey: true });
    expect(pos(a)).toEqual({ x: 0, y: 0 });
  });

  test("Cmd+Down goes to document end", () => {
    const a = mk(DOC);
    a.cursor.setPosition(3, 1);
    key(a, "ArrowDown", { metaKey: true });
    expect(pos(a)).toEqual({ x: 5, y: 2 });
  });
});

describe("characterization: word jump (Ctrl+Arrow)", () => {
  test("Ctrl+ArrowRight lands at the end of the current word", () => {
    const a = mk("foo bar baz");
    a.cursor.setPosition(0, 0);
    key(a, "ArrowRight", { ctrlKey: true });
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });

  test("Ctrl+ArrowLeft lands at the start of the previous word", () => {
    const a = mk("foo bar baz");
    a.cursor.setPosition(7, 0); // the space before "baz"
    key(a, "ArrowLeft", { ctrlKey: true });
    expect(pos(a)).toEqual({ x: 4, y: 0 });
  });
});

describe("characterization: HIGHLIGHT mode", () => {
  test("ArrowRight advances the column in HIGHLIGHT mode", () => {
    const a = mk(DOC, EditMode.HIGHLIGHT);
    a.cursor.setPosition(2, 0);
    key(a, "ArrowRight");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });
});
