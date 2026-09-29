/**
 * Cmd+Backspace in RAW mode: a tag right before the caret is deleted as a whole
 * (opening or closing); anywhere else it deletes back to the line start.
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
const pos = (a: Annotator) => ({ x: a.cursor.xLine, y: a.cursor.yLine });

describe("Cmd+Backspace after a tag", () => {
  test("deletes the opening tag before the caret", () => {
    const a = mk("ab<T1>cd</T1>");
    a.cursor.setPosition(6, 0);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("abcd</T1>");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });

  test("deletes the closing tag before the caret", () => {
    const a = mk("ab<T1>cd</T1>");
    a.cursor.setPosition(13, 0);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("ab<T1>cd");
    expect(pos(a)).toEqual({ x: 8, y: 0 });
  });

  test("deletes a tag with attributes", () => {
    const a = mk('x <w lemma="a b" n="1">y');
    a.cursor.setPosition(23, 0);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("x y");
    expect(pos(a)).toEqual({ x: 2, y: 0 });
  });

  test("only touches the tag's own line", () => {
    const a = mk("first\nab<T1>cd");
    a.cursor.setPosition(6, 1);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("first\nabcd");
    expect(pos(a)).toEqual({ x: 2, y: 1 });
  });

  test("deletes a tag that wraps over several visual lines", () => {
    const a = mk("ab<T1>");
    const tag = `<${"x".repeat(a.text.charsAtLine * 3)}>`;
    a.text.value = `ab ${tag}`;
    a.text.prepareSegments();
    a.text.calculateLines();
    expect(a.text.noLines).toBeGreaterThan(2);
    a.cursor.moveToOffset(a.text, a.text.value.length);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("ab ");
    expect(pos(a)).toEqual({ x: 3, y: 0 });
  });

  test("still deletes to the line start when no tag ends at the caret", () => {
    const a = mk("ab<T1>cd");
    a.cursor.setPosition(8, 0);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("");
    expect(pos(a)).toEqual({ x: 0, y: 0 });
  });

  test("a stray > is not a tag", () => {
    const a = mk("a > b >");
    a.cursor.setPosition(7, 0);
    key(a, "Backspace", { metaKey: true });
    expect(a.text.value).toBe("");
  });

  test("Ctrl+Backspace deletes the tag before the caret too", () => {
    const a = mk("ab<T1>cd</T1>");
    a.cursor.setPosition(13, 0);
    key(a, "Backspace", { ctrlKey: true });
    expect(a.text.value).toBe("ab<T1>cd");
    expect(pos(a)).toEqual({ x: 8, y: 0 });
  });

  test("undo restores the deleted tag", () => {
    const a = mk("ab<T1>cd</T1>");
    a.cursor.setPosition(6, 0);
    key(a, "Backspace", { metaKey: true });
    key(a, "z", { metaKey: true });
    expect(a.text.value).toBe("ab<T1>cd</T1>");
  });
});
