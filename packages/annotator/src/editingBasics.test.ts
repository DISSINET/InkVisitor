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

describe("select-all", () => {
  test("Ctrl+A selects to the last valid line index (inclusive)", () => {
    const a = mk("line1\nline2");
    key(a, "a", { ctrlKey: true });
    expect(a.cursor.selectStart).toEqual({ xLine: 0, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 5, yLine: a.text.noLines - 1 });
    expect(a.text.noLines - 1).toBe(1); // sanity: last valid line is 1, not 2
  });
});
