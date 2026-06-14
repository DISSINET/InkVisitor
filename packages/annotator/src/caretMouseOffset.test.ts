/**
 * Phase 3 (Step B) — mouse interactions set the canonical document offset.
 *
 * Click/drag go through getBoundingClientRect (0-sized in jsdom, so positioning
 * isn't meaningfully testable here); double-click uses offsetX and IS testable.
 * It must set anchor = word start offset, head = word end offset.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

describe("double-click sets canonical anchor/head offsets", () => {
  test("selecting a word stores its start/end as offsets", () => {
    const a = mk("foo bar baz");
    const col = 5; // inside "bar" (cols 4..7)
    a.onMouseDoubleClick({
      offsetX: col * (a.charWidth / a.ratio),
      offsetY: 0.5 * (a.lineHeight / a.ratio),
      preventDefault: () => {},
    } as unknown as MouseEvent);
    expect(a.cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
    expect(a.cursor.anchor).toBe(4); // word start
    expect(a.cursor.head).toBe(7); // word end (caret)
  });
});
