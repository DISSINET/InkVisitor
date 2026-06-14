/**
 * Characterization tests — Phase 2, Task 2.3 (editing).
 *
 * These lock the CURRENT editing behavior of the annotator as a safety net
 * before the cursor-model refactor (see packages/annotator/BASIC_EDITOR_BACKLOG.md).
 * They assert what the editor does today, not necessarily what is "ideal" — if a
 * value looks wrong, that is a separate bug to file, not something to change here.
 *
 * Each case records the resulting `text.value` and caret `{x,y}`.
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
    code: "",
    preventDefault: () => {},
    ...mods,
  } as KeyboardEvent);
const pos = (a: Annotator) => ({ x: a.cursor.xLine, y: a.cursor.yLine });
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Select "bc" in a "abcde"-style doc starting from caret at (1,0). */
const selectBC = (a: Annotator) => {
  a.cursor.setPosition(1, 0);
  key(a, "ArrowRight", { shiftKey: true });
  key(a, "ArrowRight", { shiftKey: true });
};

describe("characterization: insert character", () => {
  test("typing inserts at the caret and advances it", () => {
    const a = mk("abc");
    a.cursor.setPosition(1, 0);
    key(a, "X");
    expect(a.text.value).toBe("aXbc");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });

  test("typing with an active selection replaces it", () => {
    const a = mk("abcde");
    selectBC(a);
    key(a, "X");
    expect(a.text.value).toBe("aXde");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });

  test("typing in HIGHLIGHT mode does not change the document", () => {
    const a = mk("abc", EditMode.HIGHLIGHT);
    a.cursor.setPosition(1, 0);
    key(a, "X");
    expect(a.text.value).toBe("abc");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
  });
});

describe("characterization: Backspace", () => {
  test("Backspace mid-line deletes the char before the caret", () => {
    const a = mk("abc");
    a.cursor.setPosition(2, 0);
    key(a, "Backspace");
    expect(a.text.value).toBe("ac");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
  });

  test("Backspace at line start joins with the previous line", () => {
    const a = mk("ab\ncd");
    a.cursor.setPosition(0, 1);
    key(a, "Backspace");
    expect(a.text.value).toBe("abcd");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });

  test("Backspace with a selection deletes the selection", () => {
    const a = mk("abcde");
    selectBC(a);
    key(a, "Backspace");
    expect(a.text.value).toBe("ade");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
  });
});

describe("characterization: Delete", () => {
  test("Delete mid-line deletes the char after the caret", () => {
    const a = mk("abc");
    a.cursor.setPosition(1, 0);
    key(a, "Delete");
    expect(a.text.value).toBe("ac");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
  });

  test("Delete at line end joins with the next line", () => {
    const a = mk("ab\ncd");
    a.cursor.setPosition(2, 0);
    key(a, "Delete");
    expect(a.text.value).toBe("abcd");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });
});

describe("characterization: Enter", () => {
  test("Enter splits the line at the caret", () => {
    const a = mk("abcd");
    a.cursor.setPosition(2, 0);
    key(a, "Enter");
    expect(a.text.value).toBe("ab\ncd");
    expect(pos(a)).toEqual({ x: 0, y: 1 });
  });

  test("Enter with a selection replaces it then splits", () => {
    const a = mk("abcde");
    selectBC(a);
    key(a, "Enter");
    expect(a.text.value).toBe("a\nde");
    expect(pos(a)).toEqual({ x: 0, y: 1 });
  });
});

describe("characterization: paste", () => {
  test("paste with no selection inserts at the caret", async () => {
    const a = mk("abc");
    a.cursor.setPosition(1, 0);
    (window.navigator.clipboard as any) = {
      readText: () => Promise.resolve("XY"),
      writeText: () => Promise.resolve(),
    };
    a.onPasteText();
    await flush();
    expect(a.text.value).toBe("aXYbc");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });

  test("paste with a selection replaces it", async () => {
    const a = mk("abcde");
    selectBC(a);
    (window.navigator.clipboard as any) = {
      readText: () => Promise.resolve("ZZ"),
      writeText: () => Promise.resolve(),
    };
    a.onPasteText();
    await flush();
    expect(a.text.value).toBe("aZZde");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });
});

describe("characterization: cut (Ctrl+X)", () => {
  test("cut removes the selection and writes it to the clipboard", () => {
    const a = mk("abcde");
    let written = "NONE";
    (window.navigator.clipboard as any) = {
      readText: () => Promise.resolve(""),
      writeText: (t: string) => {
        written = t;
        return Promise.resolve();
      },
    };
    a.onSelectText(() => {}); // wire up lastSelectedText tracking
    selectBC(a);
    a.draw(); // populates lastSelectedText from the current selection
    key(a, "x", { ctrlKey: true });
    expect(a.text.value).toBe("ade");
    expect(pos(a)).toEqual({ x: 1, y: 0 });
    expect(written).toBe("bc");
  });
});
