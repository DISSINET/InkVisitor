import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

const fullRange = (t: Text): string => {
  const visualLines = t.getRangeLines(0, t.noLines);
  const lastLine = visualLines[visualLines.length - 1] ?? "";
  return t.getRangeText(
    { xLine: 0, yLine: 0 },
    { xLine: lastLine.length, yLine: t.noLines - 1 }
  );
};

describe("copy with natural breaks (#2551)", () => {
  test("a single soft-wrapped paragraph copies with no injected newlines", () => {
    const source = "the quick brown fox jumps over the lazy dog";
    const t = new Text(source, 10); // budget 10 chars -> forces wrapping

    expect(t.noLines).toBeGreaterThan(1); // sanity: it really wrapped
    const copied = fullRange(t);

    expect(copied.includes("\n")).toBe(false);
    expect(copied).toBe(source);
  });

  test("real newlines between paragraphs are preserved exactly once", () => {
    const source = "first paragraph here\nsecond paragraph here";
    const t = new Text(source, 8); // both paragraphs wrap

    expect(t.noLines).toBeGreaterThan(2);
    const copied = fullRange(t);

    expect(copied).toBe(source);
    expect((copied.match(/\n/g) || []).length).toBe(1);
  });

  test("a sub-range that spans a soft-wrap boundary has no injected newline", () => {
    const source = "alpha beta gamma delta";
    const t = new Text(source, 10);
    // Select from start of doc to the end of the second visual line.
    const visualLines = t.getRangeLines(0, t.noLines);
    const copied = t.getRangeText(
      { xLine: 0, yLine: 0 },
      { xLine: visualLines[1].length, yLine: 1 }
    );
    expect(copied.includes("\n")).toBe(false);
  });

  test("blank lines (empty segments) between paragraphs are preserved", () => {
    const source = "alpha\n\nbeta";
    const t = new Text(source, 20); // no wrapping needed; tests segment joining
    expect(fullRange(t)).toBe(source);
  });

  test("HIGHLIGHT mode still strips tags and injects no soft-wrap newline", () => {
    const source = "the <person>quick brown</person> fox runs";
    const t = new Text(source, 12);
    t.mode = EditMode.HIGHLIGHT;
    t.calculateLines();

    const copied = fullRange(t);
    expect(copied.includes("\n")).toBe(false);
    expect(copied).toBe("the quick brown fox runs");
  });
});
