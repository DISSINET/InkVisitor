/**
 * A multi-line selection highlight ends flush with the last character of
 * each opening/middle wrapped line. It must NOT paint an extra "virtual" newline
 * column one past the content (Google-Docs style, which does not highlight a
 * phantom char at a soft-wrap line break).
 *
 * drawLine(ctx, relLine, xStart, xEnd, options, absLine): the highlight rect
 * spans columns [xStart, xEnd), so xEnd is the load-bearing "how far right" value.
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
  a.text.updateCharsAtLine(10); // wrap at column 10
  return a;
};

// The last drawLine call for a given absolute line (the highlight row for it).
const rowEndFor = (
  spy: jest.SpyInstance,
  absLine: number
): { start: number; end: number } | undefined => {
  const call = [...spy.mock.calls].reverse().find((args) => args[5] === absLine);
  return call ? { start: call[2] as number, end: call[3] as number } : undefined;
};

describe("selection highlight has no virtual newline column", () => {
  test("the opening line of a multi-line selection ends at the last char, not one past it", () => {
    const a = mk("supercalifragilistic"); // ["supercalif","ragilistic"]
    expect(a.text.getLine(0)).toBe("supercalif");

    a.cursor.setSpanByOffsets(a.text, 5, 15); // (5,0) -> (5,1), spans the soft wrap
    expect(a.cursor.isSelected()).toBe(true);

    const spy = jest.spyOn(a.cursor, "drawLine");
    a.draw();

    const opening = rowEndFor(spy, 0);
    expect(opening).toBeDefined();
    expect(opening!.start).toBe(5);
    expect(opening!.end).toBe(a.text.getLine(0).length); // 10, not 11
  });

  test("a fully-selected middle line ends at the last char, not one past it", () => {
    const a = mk("aaaaaaaaaabbbbbbbbbbcccccccccc"); // 3 lines of 10
    expect(a.text.getLine(1)).toBe("bbbbbbbbbb");

    a.cursor.setSpanByOffsets(a.text, 2, 22); // (2,0) -> (2,2): line 1 fully inside
    expect(a.cursor.isSelected()).toBe(true);

    const spy = jest.spyOn(a.cursor, "drawLine");
    a.draw();

    const middle = rowEndFor(spy, 1);
    expect(middle).toBeDefined();
    expect(middle!.start).toBe(0);
    expect(middle!.end).toBe(a.text.getLine(1).length); // 10, not 11
  });
});
