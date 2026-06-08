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

describe("ArrowRight at boundaries", () => {
  test("at end of single-line document stays at EOL", () => {
    const a = mk("hello");
    a.cursor.setPosition(5, 0);
    key(a, "ArrowRight");
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 5, y: 0 });
  });

  test("at end of a non-last line moves to start of next line", () => {
    const a = mk("ab\ncd");
    a.cursor.setPosition(2, 0); // end of "ab"
    key(a, "ArrowRight");
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 0, y: 1 });
  });
});

describe("goal column", () => {
  test("returns to the original column after crossing a short line", () => {
    const a = mk("0123456789ABCDEF\nshort\n0123456789ABCDEF");
    a.cursor.setPosition(15, 0); // long line, column 15
    key(a, "ArrowDown"); // onto "short" (len 5) -> clamps to 5
    expect(a.cursor.xLine).toBe(5);
    key(a, "ArrowDown"); // back onto a long line -> should restore 15
    expect(a.cursor.xLine).toBe(15);
  });

  test("a horizontal move resets the goal column", () => {
    const a = mk("0123456789ABCDEF\nshort\n0123456789ABCDEF");
    a.cursor.setPosition(15, 0);
    key(a, "ArrowDown"); // x=5 on "short"
    key(a, "ArrowLeft"); // x=4, goal reset
    key(a, "ArrowDown"); // onto long line -> stays near 4, NOT 15
    expect(a.cursor.xLine).toBe(4);
  });

  test("Cmd+Up (jump to document start) resets the goal column", () => {
    const a = mk("0123456789ABCDEF\nshort\n0123456789ABCDEF");
    a.cursor.setPosition(15, 0);
    key(a, "ArrowDown"); // goalColumn=15, x=5 on "short"
    key(a, "ArrowUp", { metaKey: true }); // jump to (0,0); must drop the goal
    key(a, "ArrowDown"); // onto "short" -> column should be 0, NOT restored 15
    expect(a.cursor.xLine).toBe(0);
  });

  test("onReplaceText resets the goal column", () => {
    const a = mk("0123456789ABCDEF\nshort\n0123456789ABCDEF");
    a.cursor.setPosition(15, 0);
    key(a, "ArrowDown"); // goalColumn=15
    a.onReplaceText(""); // programmatic edit -> goal must reset
    expect(a.cursor.goalColumn).toBeNull();
  });
});
