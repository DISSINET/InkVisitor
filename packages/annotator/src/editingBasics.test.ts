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
    preventDefault: () => {},
    ...mods,
  } as KeyboardEvent);

describe("scroll caret into view after programmatic insert", () => {
  const manyLines = Array.from({ length: 60 }, (_, i) => `line ${i}`).join("\n");

  test("onReplaceText scrolls a caret that is below the viewport into view", () => {
    const a = mk(manyLines); // 60 document lines
    a.viewport.lineStart = 0; // viewport at the top
    a.cursor.setPosition(0, 50); // caret far below the visible window
    a.onReplaceText(""); // a no-op edit must still reveal the caret

    expect(a.cursor.yLine).toBe(50);
    expect(a.viewport.lineStart).toBeLessThanOrEqual(50);
    expect(50).toBeLessThan(a.viewport.lineEnd);
  });

  test("onPasteText scrolls a caret that is below the viewport into view", async () => {
    const a = mk(manyLines);
    a.viewport.lineStart = 0;
    a.cursor.setPosition(0, 50);
    (window.navigator as unknown as { clipboard: { readText: () => Promise<string> } }).clipboard = {
      readText: () => Promise.resolve(""),
    };

    a.onPasteText();
    await new Promise((r) => setTimeout(r, 0)); // flush the clipboard promise

    expect(a.viewport.lineStart).toBeLessThanOrEqual(50);
    expect(50).toBeLessThan(a.viewport.lineEnd);
  });
});

describe("Tab", () => {
  test("inserts a tab character at the caret", () => {
    const a = mk("ab");
    a.cursor.setPosition(1, 0); // between a and b
    key(a, "Tab");
    expect(a.text.value).toBe("a\tb");
    expect(a.cursor.xLine).toBe(2);
  });
});

describe("select-all", () => {
  test("Ctrl+A selects to the last valid line index (inclusive)", () => {
    const a = mk("line1\nline2");
    key(a, "a", { ctrlKey: true });
    expect(a.cursor.selectStart).toEqual({ xLine: 0, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 5, yLine: a.text.noLines - 1 });
    expect(a.text.noLines - 1).toBe(1); // sanity: last valid line is 1, not 2
  });
});
