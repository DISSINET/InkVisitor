/**
 * Phase 4 (#3086) — undo/redo end-to-end through the keyboard + public API.
 *
 * Snapshots are document string + offsets (Phase 3), so undo restores both the
 * text and the caret. Coalescing: a contiguous run of single-char typing is one
 * undo step; Enter / Backspace / Delete / paste / replace are discrete steps.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

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
const flush = () => new Promise((r) => setTimeout(r, 0));
const type = (a: Annotator, s: string) => {
  for (const ch of s) key(a, ch);
};

describe("undo/redo: typing", () => {
  test("a typing run is a single undo step, and redo restores it", () => {
    const a = mk("");
    type(a, "abc");
    expect(a.text.value).toBe("abc");

    a.undo();
    expect(a.text.value).toBe("");
    expect(a.canUndo()).toBe(false);

    a.redo();
    expect(a.text.value).toBe("abc");
    expect(a.cursor.head).toBe(3);
  });

  test("Ctrl+Z / Ctrl+Y from the keyboard drive undo/redo", () => {
    const a = mk("");
    type(a, "hi");
    key(a, "z", { ctrlKey: true });
    expect(a.text.value).toBe("");
    key(a, "y", { ctrlKey: true });
    expect(a.text.value).toBe("hi");
  });

  test("Cmd+Z / Cmd+Shift+Z (mac) drive undo/redo", () => {
    const a = mk("");
    type(a, "hi");
    key(a, "z", { metaKey: true });
    expect(a.text.value).toBe("");
    key(a, "Z", { metaKey: true, shiftKey: true });
    expect(a.text.value).toBe("hi");
  });

  test("undo restores the caret to where it was before the edit", () => {
    const a = mk("hello world");
    a.cursor.setPosition(5, 0); // between "hello" and " world"
    key(a, "X");
    expect(a.text.value).toBe("helloX world");
    expect(a.cursor.head).toBe(6);

    a.undo();
    expect(a.text.value).toBe("hello world");
    expect(a.cursor.head).toBe(5);
  });
});

describe("undo/redo: discrete steps", () => {
  test("a delete is undone separately from the preceding typing run", () => {
    const a = mk("");
    type(a, "ab");
    key(a, "Backspace"); // -> "a"
    expect(a.text.value).toBe("a");

    a.undo(); // undoes the backspace
    expect(a.text.value).toBe("ab");

    a.undo(); // undoes the typing run
    expect(a.text.value).toBe("");
  });

  test("Enter is its own undo step", () => {
    const a = mk("ab");
    a.cursor.setPosition(1, 0);
    key(a, "Enter"); // -> "a\nb"
    expect(a.text.value).toBe("a\nb");
    a.undo();
    expect(a.text.value).toBe("ab");
  });

  test("a paste is a single undo step", async () => {
    const a = mk("hello");
    a.cursor.setPosition(5, 0);
    (window.navigator.clipboard as any) = {
      readText: () => Promise.resolve("XYZ"),
      writeText: () => Promise.resolve(),
    };
    a.onPasteText();
    await flush();
    expect(a.text.value).toBe("helloXYZ");

    a.undo();
    expect(a.text.value).toBe("hello");
  });

  test("onReplaceText is a single undo step", () => {
    const a = mk("abc");
    a.cursor.setPosition(3, 0);
    a.onReplaceText("XY");
    expect(a.text.value).toBe("abcXY");
    a.undo();
    expect(a.text.value).toBe("abc");
  });
});

describe("undo/redo: edges", () => {
  test("undo with empty history is a no-op", () => {
    const a = mk("abc");
    expect(a.canUndo()).toBe(false);
    a.undo();
    expect(a.text.value).toBe("abc");
  });

  test("redo with empty history is a no-op", () => {
    const a = mk("abc");
    expect(a.canRedo()).toBe(false);
    a.redo();
    expect(a.text.value).toBe("abc");
  });

  test("a new edit after undo clears the redo path", () => {
    const a = mk("");
    type(a, "abc");
    a.undo(); // -> ""
    expect(a.canRedo()).toBe(true);
    type(a, "x"); // fresh edit
    expect(a.canRedo()).toBe(false);
    expect(a.text.value).toBe("x");
  });

  test("pure navigation does not create an undo step", () => {
    const a = mk("abc");
    a.cursor.setPosition(0, 0);
    key(a, "ArrowRight");
    key(a, "ArrowRight");
    key(a, "End");
    expect(a.canUndo()).toBe(false);
  });

  test("undo/redo are no-ops in HIGHLIGHT mode (editing is disabled)", () => {
    // History built in RAW survives a mode switch (setMode keeps the stack).
    const a = mk("", EditMode.RAW);
    type(a, "abc");
    expect(a.text.value).toBe("abc");

    a.setMode(EditMode.HIGHLIGHT);

    // HIGHLIGHT disables all editing; undo/redo must not mutate the document.
    // Otherwise text.value would change while onTextChangeCb is suppressed,
    // silently desyncing the editor from the host app.
    key(a, "z", { ctrlKey: true });
    expect(a.text.value).toBe("abc");
    expect(a.canUndo()).toBe(true); // stack left untouched

    a.undo(); // public API is gated too
    expect(a.text.value).toBe("abc");

    a.redo();
    expect(a.text.value).toBe("abc");
  });
});
