import { Annotator } from "./lib/Annotator";
import { SegmentPosition } from "./lib/Text";

/**
 * Regression tests for issue #2051: anchors listed for a selection must be
 * ordered "from inside outwards" — the innermost / most specific anchor first,
 * then the enclosing ones — while anchors that sit next to each other
 * (parallel / same-level) keep their order of appearance.
 */

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
};

// getAnnotations() only reads `segmentIndex` and `rawTextIndex` from its
// position arguments, so we can build the selection bounds directly from raw
// (segment-relative) string offsets.
const posSeg = (segmentIndex: number, rawTextIndex: number): SegmentPosition => ({
  segmentIndex,
  lineIndex: 0,
  charInLineIndex: 0,
  parsedTextIndex: 0,
  rawTextIndex,
});

// Shorthand for single-segment (single-line) texts.
const pos = (rawTextIndex: number): SegmentPosition => posSeg(0, rawTextIndex);

const names = (a: Annotator, start: SegmentPosition, end: SegmentPosition) =>
  a.getAnnotations(start, end).map((tag) => tag.getTagName());

describe("getAnnotations ordering (issue #2051)", () => {
  test("nested anchors are ordered from inside outwards", () => {
    // <T1><S1><L1>word</L1></S1></T1>
    const text = "<T1><S1><L1>word</L1></S1></T1>";
    const a = mk(text);

    const start = pos(text.indexOf("word"));
    const end = pos(text.indexOf("word") + "word".length);

    // innermost (Location) first, then its Statement, then the Territory
    expect(names(a, start, end)).toEqual(["L1", "S1", "T1"]);
  });

  test("parallel (same-level) anchors keep their order of appearance", () => {
    // <A>aa</A> <B>bb</B>
    const text = "<A>aa</A> <B>bb</B>";
    const a = mk(text);

    const start = pos(text.indexOf("aa"));
    const end = pos(text.indexOf("bb")); // selection spans both anchors

    expect(names(a, start, end)).toEqual(["A", "B"]);
  });

  test("mixes nesting and parallel siblings: each branch closes before its parent", () => {
    // <T><S1>a</S1><S2>b<L1>c</L1>d</S2></T>
    const text = "<T><S1>a</S1><S2>b<L1>c</L1>d</S2></T>";
    const a = mk(text);

    const start = pos(text.indexOf("a"));
    const end = pos(text.indexOf("d") + 1);

    // S1 closes first, then the inner L1, then its parent S2, then T
    expect(names(a, start, end)).toEqual(["S1", "L1", "S2", "T"]);
  });

  test("nested anchors whose closing tags are on later lines are still inside->out", () => {
    // The common real case: a word-level anchor whose enclosing Statement /
    // Territory anchors close on a later line (later segment). Their closing
    // tags are never scanned, yet the order must stay inside -> outside.
    // segment 0: "<T3><T2><S1><L1>Rome"
    // segment 1: "more text</L1></S1></T2></T3>"
    const text = "<T3><T2><S1><L1>Rome\nmore text</L1></S1></T2></T3>";
    const a = mk(text);

    const start = pos(text.indexOf("Rome"));
    const end = pos(text.indexOf("Rome") + "Rome".length);

    expect(names(a, start, end)).toEqual(["L1", "S1", "T2", "T3"]);
  });

  test("inner anchor closing in-segment sorts before enclosing anchors closing later", () => {
    // <L> closes within the selection's segment (finite closing position),
    // while <S> and <T> stay open into a later segment.
    // segment 0: "<T><S><L>Rome</L> and more"
    // segment 1: "text</S></T>"
    const text = "<T><S><L>Rome</L> and more\ntext</S></T>";
    const a = mk(text);

    const start = pos(text.indexOf("Rome"));
    const end = pos(text.indexOf("Rome") + "Rome".length);

    expect(names(a, start, end)).toEqual(["L", "S", "T"]);
  });

  test("selection spanning several segments: enclosing anchors closing later segments stay inside->out", () => {
    // The selection itself crosses segment boundaries (end.segmentIndex > 0), so
    // the enclosing anchors' closing tags fall *inside* the scanned range and are
    // paired as finite closing positions rather than +Infinity.
    // segment 0: "<T><S><L>aa"
    // segment 1: "bb</L> cc"   (</L> closes here)
    // segment 2: "dd</S></T>"  (</S>, </T> close here)
    const text = "<T><S><L>aa\nbb</L> cc\ndd</S></T>";
    const a = mk(text);

    const start = posSeg(0, "<T><S><L>aa".indexOf("aa")); // "aa" in segment 0
    const end = posSeg(2, "dd</S></T>".indexOf("dd") + "dd".length); // after "dd" in segment 2

    expect(names(a, start, end)).toEqual(["L", "S", "T"]);
  });
});
