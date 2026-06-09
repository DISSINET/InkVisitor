/**
 * Phase 3 pivot (P2) — offset-based editing keeps the caret/selection in bounds.
 *
 * Two bounds bugs the fuzz (caretBoundsFuzz) surfaced, reproduced minimally:
 *  1. Enter on the last visual line of a wrapped segment: the old blind
 *     `moveToNewline` (yLine += 1) overshoots when the split re-wraps the prefix
 *     into fewer visual lines, leaving the caret past the last line.
 *  2. Typing with a stale (collapsed) selection present leaves selectStart/End
 *     set; after the edit re-wraps they can point past the (now shorter) line.
 * Both are fixed by setting the caret from the post-edit document OFFSET.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string, mode: EditMode, charsAtLine: number): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(mode);
  a.text.updateCharsAtLine(charsAtLine);
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

const expectCaretInBounds = (a: Annotator) => {
  expect(a.cursor.yLine).toBeGreaterThanOrEqual(0);
  expect(a.cursor.yLine).toBeLessThanOrEqual(a.text.noLines - 1);
  const lineLen = (a.text.getLine(a.cursor.yLine) ?? "").length;
  expect(a.cursor.xLine).toBeGreaterThanOrEqual(0);
  expect(a.cursor.xLine).toBeLessThanOrEqual(lineLen);
  const off = a.text.offsetFromVisual(a.cursor.xLine, a.cursor.yLine);
  expect(off).toBeGreaterThanOrEqual(0);
  expect(off).toBeLessThanOrEqual(a.text.value.length);
};

describe("Enter keeps the caret in bounds when the split re-wraps", () => {
  test("Enter mid last visual line of a wrapped segment", () => {
    // Reproduces caretBoundsFuzz wrapped/seed=7 (the prefix loses a visual line).
    const a = mk(
      "s\nupercalifragilisticexpialidocious word twoaZ",
      EditMode.RAW,
      10
    );
    a.cursor.setPosition(1, 5); // inside "twoaZ", the last visual line
    key(a, "Enter");
    expectCaretInBounds(a);
    // newline was inserted at raw offset of the pre-Enter caret; caret follows it.
    expect(a.text.value).toContain("\n");
  });
});

describe("typing collapses any stale selection (keeps selection in bounds)", () => {
  test("a collapsed selection is cleared when a character is typed", () => {
    const a = mk("hello world", EditMode.RAW, 100);
    a.cursor.setPosition(5, 0);
    a.cursor.selectStart = { xLine: 5, yLine: 0 };
    a.cursor.selectEnd = { xLine: 5, yLine: 0 }; // stale degenerate selection
    key(a, "x");
    expect(a.cursor.selectStart).toBeUndefined();
    expect(a.cursor.selectEnd).toBeUndefined();
    expect(a.text.value).toBe("helloxx world".replace("xx", "x")); // "hellox world"
    expectCaretInBounds(a);
  });

  test("typing near a wrap boundary with a stale selection stays in bounds", () => {
    // Reproduces caretBoundsFuzz wrapped/seed=1337 shape: collapsed selection at
    // an EOL that shrinks after the insert re-wraps.
    const a = mk("supercalifragilistic word two", EditMode.RAW, 10);
    a.cursor.setPosition(10, 0); // end of first wrapped visual line
    a.cursor.selectStart = { xLine: 10, yLine: 0 };
    a.cursor.selectEnd = { xLine: 10, yLine: 0 };
    key(a, "Z");
    expect(a.cursor.selectStart).toBeUndefined();
    expect(a.cursor.selectEnd).toBeUndefined();
    expectCaretInBounds(a);
  });
});

describe("offset positioning preserves normal typing behavior", () => {
  test("typing mid-line inserts and advances the caret", () => {
    const a = mk("abc", EditMode.RAW, 100);
    a.cursor.setPosition(1, 0);
    key(a, "X");
    expect(a.text.value).toBe("aXbc");
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 2, y: 0 });
  });

  test("Enter mid-line splits and moves to the new line start", () => {
    const a = mk("abcd", EditMode.RAW, 100);
    a.cursor.setPosition(2, 0);
    key(a, "Enter");
    expect(a.text.value).toBe("ab\ncd");
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 0, y: 1 });
  });
});

describe("multi-line insert places the caret at the end of the inserted text", () => {
  test("onReplaceText with embedded newlines lands the caret after it", () => {
    const a = mk("abc", EditMode.RAW, 100);
    a.cursor.setPosition(1, 0); // between a and b -> raw offset 1
    a.onReplaceText("X\nY");
    expect(a.text.value).toBe("aX\nYbc");
    // caret = offset 1 + 3 = 4 -> after "Y" on line 1
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 1, y: 1 });
    expectCaretInBounds(a);
  });

  test("paste with embedded newlines lands the caret after it", async () => {
    const a = mk("abc", EditMode.RAW, 100);
    a.cursor.setPosition(1, 0);
    (window.navigator.clipboard as any) = {
      readText: () => Promise.resolve("X\nY"),
      writeText: () => Promise.resolve(),
    };
    a.onPasteText();
    await new Promise((r) => setTimeout(r, 0));
    expect(a.text.value).toBe("aX\nYbc");
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 1, y: 1 });
    expectCaretInBounds(a);
  });
});
