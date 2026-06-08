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
