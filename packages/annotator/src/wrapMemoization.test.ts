/**
 * Segment-level wrap memoization in Text.calculateLines.
 *
 * Every edit funnels into calculateLines, which used to re-tokenize and re-wrap
 * every paragraph of the document; on a large document that made each keystroke
 * pay for thousands of untouched paragraphs. A segment now keeps its wrapped
 * lines as long as none of the inputs that shaped them changed, and a recalc
 * only renumbers its line range. These tests pin down both halves: clean
 * segments are reused (by array identity), and every input that must invalidate
 * the cache does.
 */
import Text from "./lib/Text";
import Viewport from "./lib/Viewport";
import { TextMeasurer } from "./lib/TextMeasurer";
import { EditMode } from "./lib/constants";

const VP = new Viewport(0, 40);
const at = (xLine: number, yLine: number) => ({ xLine, yLine });

const mkText = (value: string, charsAtLine = 20, mode = EditMode.RAW): Text => {
  const t = new Text(value, charsAtLine);
  t.mode = mode;
  return t;
};

/** Every per-segment output a rebuild-from-scratch must agree on. */
const layoutOf = (t: Text) =>
  t.segments.map((s) => ({
    lines: s.lines,
    lineStart: s.lineStart,
    lineEndExclusive: s.lineEndExclusive,
    indent: s.indent,
    // Absolute tag positions exercise Tag.segmentIndex, which segment reuse
    // must restamp when a segment's position shifts.
    tags: [...s.openingTags, ...s.closingTags].map((tag) =>
      tag.getAbsoluteTagPosition(t.segments)
    ),
  }));

/** A fresh Text wrapped from the same document under the same settings. */
const rebuilt = (t: Text): Text => {
  const fresh = new Text(t.value, t.charsAtLine);
  fresh.mode = t.mode;
  fresh.setParagraphIndent(t.paragraphIndent);
  return fresh;
};

const expectSameLayout = (t: Text) => {
  const fresh = rebuilt(t);
  expect(t.noLines).toBe(fresh.noLines);
  expect(layoutOf(t)).toEqual(layoutOf(fresh));
};

describe("reuse of untouched segments", () => {
  test("an edit re-wraps only the edited paragraph", () => {
    const t = mkText("first paragraph\nsecond one\nthird paragraph here");
    const [before0, before1, before2] = t.segments.map((s) => s.lines);

    t.insertText(VP, at(0, 0), "x");

    expect(t.segments[0].lines).not.toBe(before0);
    expect(t.segments[1].lines).toBe(before1);
    expect(t.segments[2].lines).toBe(before2);
    expectSameLayout(t);
  });

  test("a recalc with nothing changed reuses every segment", () => {
    const t = mkText("first paragraph\nsecond one");
    const before = t.segments.map((s) => s.lines);

    t.calculateLines();

    t.segments.forEach((s, i) => expect(s.lines).toBe(before[i]));
  });

  test("segments after a growing edit are renumbered, not re-wrapped", () => {
    const t = mkText("aa\n" + "word ".repeat(6).trim() + "\nlast");
    const lastLines = t.segments[2].lines;
    const lastStartBefore = t.segments[2].lineStart;

    // Enough text to wrap the middle paragraph onto more visual lines.
    t.insertText(VP, at(0, t.segments[1].lineStart), "growing ".repeat(4));

    expect(t.segments[2].lines).toBe(lastLines);
    expect(t.segments[2].lineStart).toBeGreaterThan(lastStartBefore);
    expectSameLayout(t);
  });

  test("deleting a character re-wraps only its paragraph", () => {
    const t = mkText("first paragraph\nsecond one\nthird");
    const before2 = t.segments[2].lines;

    t.deleteTextChar(VP, at(3, t.segments[1].lineStart));

    expect(t.segments[2].lines).toBe(before2);
    expectSameLayout(t);
  });

  test("a range delete keeps the paragraphs around it", () => {
    // Backspace and Delete both route through deleteRangeText, which re-splits
    // the whole segment list; the untouched head and tail must survive it.
    const t = mkText("first paragraph\nsecond one\nthird paragraph");
    const [before0, , before2] = t.segments.map((s) => s.lines);

    const y = t.segments[1].lineStart;
    t.deleteRangeText(at(3, y), at(4, y));

    expect(t.segments[0].lines).toBe(before0);
    expect(t.segments[2].lines).toBe(before2);
    expectSameLayout(t);
  });

  test("removing a whole paragraph reuses and renumbers the ones below", () => {
    const t = mkText("first\n<t1>tagged</t1>\nthird\nfourth");
    const thirdLines = t.segments[2].lines;

    // Delete "first\n" — every later segment shifts up one position.
    t.deleteRangeText(at(0, 0), at(0, 1));

    // The paragraph that landed on position 0 changes indent eligibility, so it
    // alone re-wraps; the ones below shift index but keep their wrapped lines.
    expect(t.segments[1].lines).toBe(thirdLines);
    expect(t.segments[0].segmentIndex).toBe(0);
    expect(t.segments[0].openingTags[0].getAbsoluteTagPosition(t.segments)).toBe(0);
    expectSameLayout(t);
  });
});

describe("invalidation", () => {
  test("a width change re-wraps every segment", () => {
    const t = mkText("one two three four five\nsix seven eight");
    t.updateCharsAtLine(10);
    expectSameLayout(t);
    // And the content actually moved: narrower budget, more lines.
    expect(t.segments[0].lines.length).toBeGreaterThan(1);
  });

  test("a mode change re-wraps tagged segments", () => {
    const t = mkText("<t1>tagged prose</t1> more words here", 12);
    const rawLines = t.segments[0].lines;

    t.mode = EditMode.HIGHLIGHT;
    t.calculateLines();

    // Tags are stripped from the wrap text in HIGHLIGHT, so the layout differs.
    expect(t.segments[0].lines).not.toEqual(rawLines);
    expectSameLayout(t);
  });

  test("a paragraph-indent change re-wraps and re-indents", () => {
    const t = mkText("first\n" + "ab ".repeat(10).trim());
    t.setParagraphIndent(6);
    expect(t.segments[1].indent).toBe(5); // capped at a quarter of 20
    expectSameLayout(t);

    t.setParagraphIndent(0);
    expect(t.segments[1].indent).toBe(0);
    expectSameLayout(t);
  });

  test("a measurer change re-wraps and rebuilds prefix tables", () => {
    const t = mkText("some words to wrap around\nsecond paragraph");
    const wide: TextMeasurer = { measure: (s) => s.length * 10 };
    const narrow: TextMeasurer = { measure: (s) => s.length * 20 };

    t.setMeasurer(wide, 100);
    const linesWide = t.segments[0].lines.slice();
    expect(t.segments[0].linePrefixes.length).toBe(t.segments[0].lines.length);

    t.setMeasurer(narrow, 100);
    expect(t.segments[0].lines).not.toEqual(linesWide);

    t.setMeasurer(undefined);
    expect(t.segments[0].linePrefixes).toEqual([]);
    expectSameLayout(t);
  });

  test("an unrelated edit keeps another segment's prefix tables", () => {
    const t = mkText("first words\nsecond paragraph");
    t.setMeasurer({ measure: (s) => s.length * 10 }, 80);
    const prefixes1 = t.segments[1].linePrefixes;

    t.insertText(VP, at(0, 0), "x");

    expect(t.segments[1].linePrefixes).toBe(prefixes1);
  });
});

describe("deleteTextChar keeps value and segments in sync", () => {
  // The layout comparison against a rebuild from t.value only proves anything
  // if every edit keeps value and segments telling the same story.
  test("forward delete removes the character under the cursor", () => {
    const t = mkText("abcdef");
    t.deleteTextChar(VP, at(2, 0), true);
    expect(t.segments[0].raw).toBe("abdef");
    expect(t.value).toBe("abdef");
  });

  test("forward delete at the start of a line", () => {
    const t = mkText("abc");
    t.deleteTextChar(VP, at(0, 0), true);
    expect(t.segments[0].raw).toBe("bc");
    expect(t.value).toBe("bc");
  });

  test("forward delete at the end of a line joins the next paragraph", () => {
    const t = mkText("ab\ncd");
    t.deleteTextChar(VP, at(2, 0), true);
    expect(t.value).toBe("abcd");
    expect(t.segments.length).toBe(1);
    expect(t.segments[0].raw).toBe("abcd");
  });

  test("deletes at the document edges are no-ops", () => {
    const t = mkText("ab");
    t.deleteTextChar(VP, at(0, 0), false); // Backspace at document start
    t.deleteTextChar(VP, at(2, 0), true); // Delete at document end
    expect(t.value).toBe("ab");
    expect(t.segments[0].raw).toBe("ab");
  });
});

describe("random edit sequences match a from-scratch rebuild", () => {
  // Deterministic PRNG so a failure reproduces.
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];

  test("200 mixed operations", () => {
    const t = mkText(
      "opening paragraph with some words\n" +
        "<t1>a tagged paragraph</t1> follows\n" +
        "third one wraps over the narrow budget for sure\n" +
        "\n" +
        "last paragraph"
    );
    t.setParagraphIndent(4);

    const randomSpot = () => {
      const yLine = Math.floor(rnd() * t.noLines);
      const len = t.getLine(yLine).length;
      return at(Math.floor(rnd() * (len + 1)), yLine);
    };

    for (let op = 0; op < 200; op++) {
      switch (pick(["insert", "insert", "delete", "range", "newline", "width", "mode", "indent"])) {
        case "insert":
          t.insertText(
            VP,
            randomSpot(),
            pick(["x", "word and more", " ", "<t9>", "yz", "two\nparagraphs"])
          );
          break;
        case "delete":
          t.deleteTextChar(VP, randomSpot(), rnd() < 0.5);
          break;
        case "range": {
          // The live deletion path (Backspace/Delete both route through it).
          const a = randomSpot();
          const b =
            rnd() < 0.7 ? at(a.xLine + 1, a.yLine) : randomSpot();
          t.deleteRangeText(a, t.clampVisual(b.xLine, b.yLine));
          break;
        }
        case "newline":
          t.insertNewline(VP, randomSpot());
          break;
        case "width":
          t.updateCharsAtLine(pick([12, 20, 33]));
          break;
        case "mode":
          t.mode = pick([EditMode.RAW, EditMode.HIGHLIGHT, EditMode.SEMI]);
          t.calculateLines();
          break;
        case "indent":
          t.setParagraphIndent(pick([0, 3, 6]));
          break;
      }
      expectSameLayout(t);
    }
  });
});
