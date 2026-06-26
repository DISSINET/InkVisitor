/**
 * Proportional text goal-column.
 *
 * Vertical Up/Down should keep the caret under the same *visual* position. With
 * monospace that's a character column; with proportional fonts it must be a
 * remembered PIXEL x, resolved to the nearest column on each target line via the
 * prefix table. The goal pixel x is captured once and persists across moves.
 */
import { Annotator } from "./lib/Annotator";
import { TextMeasurer } from "./lib/TextMeasurer";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
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

// 'W' wide (30), 'i' narrow (5), everything else 10.
const mock: TextMeasurer = {
  measure: (t) =>
    [...t].reduce((s, ch) => s + (ch === "W" ? 30 : ch === "i" ? 5 : 10), 0),
};

// setProportional persists to localStorage; isolate tests from each other.
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// proportional flag on + a deterministic non-uniform measurer (wide budget => no wrap).
const proportional = (a: Annotator) => {
  a.setProportional(true);
  a.text.setMeasurer(mock, 99999);
};

describe("proportional goal-column", () => {
  test("vertical move preserves the caret PIXEL x, not the char column", () => {
    const a = mk("iiii\nWW");
    proportional(a);
    a.cursor.setPosition(4, 0); // end of 'iiii' -> pixel x = 4*5 = 20
    key(a, "ArrowDown");
    // 'WW' prefix [0,30,60]; pixel 20 is past cell-0 midpoint (15) -> column 1
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("goal pixel x persists across multiple vertical moves", () => {
    const a = mk("iiii\nWW\niiii");
    proportional(a);
    a.cursor.setPosition(4, 0); // pixel 20
    key(a, "ArrowDown"); // -> 'WW' col 1
    key(a, "ArrowDown"); // -> 'iiii' again: pixel 20 -> col 4
    expect(a.cursor.yLine).toBe(2);
    expect(a.cursor.xLine).toBe(4);
  });

  test("monospace goal-column is unchanged (char column preserved)", () => {
    const a = mk("abcde\nfg\nhijkl"); // flag off
    a.cursor.setPosition(4, 0);
    key(a, "ArrowDown"); // 'fg' (len 2) -> min(4,2) = 2
    key(a, "ArrowDown"); // 'hijkl' -> goal col 4 restored
    expect(a.cursor.yLine).toBe(2);
    expect(a.cursor.xLine).toBe(4);
  });
});
