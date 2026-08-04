/**
 * Wrap performance on a large document — skipped unless `RUN_PERF=1` is set.
 *
 *   RUN_PERF=1 npx jest wrapPerf
 *
 * Timings flake on shared CI runners and this one builds a 1.4 MB document, so
 * it stays out of the normal suite; it is here to be run by hand against a
 * change to {@link Text.calculateLines} or {@link Text.prepareSegments}, whose
 * cost is invisible to the functional tests — those pass just as well when an
 * edit re-wraps the whole document as when it re-wraps one paragraph.
 *
 * Reference numbers (Apple M-series, Node 20), 4000-paragraph document:
 *
 *   | operation                         | full re-wrap | memoized |
 *   | --------------------------------- | -----------: | -------: |
 *   | type 1 char mid-document          |      27.2 ms |  0.19 ms |
 *   | backspace (deleteRangeText)       |      30.2 ms |  0.42 ms |
 *   | paste two paragraphs              |      61.6 ms |  0.82 ms |
 *   | calculateLines, nothing changed   |      28.1 ms |  0.05 ms |
 *
 * Absolute values track the machine; the shape is what matters. An edit costs
 * one paragraph's wrap, so growing PARAGRAPHS below should leave the per-edit
 * numbers roughly flat. If they start scaling with document size again, segment
 * reuse or the wrap cache stopped hitting.
 */
import Text from "./lib/Text";
import Viewport from "./lib/Viewport";

/** Words per paragraph × paragraph count ≈ a 200k-word document. */
const WORDS_PER_PARAGRAPH = 50;
const PARAGRAPHS = 4000;
const CHARS_AT_LINE = 100;
/** Wrap-budget units of paragraph first-line indent (#2076) to measure with. */
const INDENT = 2;

const VOCABULARY = [
  "ds", "quod", "haereticus", "testis", "inquisitio", "de", "anno", "domini",
  "villa", "dixit", "iuratus", "requisitus", "predicto", "eodem",
];

/** Deterministic word picker, so two runs measure the identical document. */
const mkDocument = (): string => {
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const paragraphs: string[] = [];
  for (let p = 0; p < PARAGRAPHS; p++) {
    const words: string[] = [];
    for (let w = 0; w < WORDS_PER_PARAGRAPH; w++) {
      words.push(VOCABULARY[Math.floor(rnd() * VOCABULARY.length)]);
    }
    paragraphs.push(words.join(" "));
  }
  return paragraphs.join("\n");
};

const median = (xs: number[]): number =>
  xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const results: { operation: string; ms: number }[] = [];

/** Time `fn` after letting the JIT warm up, and record the median. */
const measure = (operation: string, iterations: number, fn: () => void) => {
  for (let i = 0; i < 3; i++) fn();
  const runs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const started = performance.now();
    fn();
    runs.push(performance.now() - started);
  }
  results.push({ operation, ms: median(runs) });
};

// process.env keeps this out of the default suite; describe.skip still type-checks
// and still reports the tests as skipped rather than hiding them.
const perfDescribe = process.env.RUN_PERF ? describe : describe.skip;

perfDescribe("wrap performance on a large document", () => {
  const viewport = new Viewport(0, 40);
  let text: Text;
  /** A line in the middle of the document — the worst case for any head scan. */
  let midLine: number;

  beforeAll(() => {
    const value = mkDocument();
    text = new Text(value, CHARS_AT_LINE);
    text.setParagraphIndent(INDENT);
    midLine = text.segments[Math.floor(PARAGRAPHS / 2)].lineStart;
    console.log(
      `document: ${value.length} chars, ${text.segments.length} paragraphs, ${text.noLines} visual lines`
    );
  });

  afterAll(() => {
    const width = Math.max(...results.map((r) => r.operation.length));
    console.log(
      results
        .map((r) => `  ${r.operation.padEnd(width)}  ${r.ms.toFixed(3)} ms`)
        .join("\n")
    );
  });

  test("typing one character", () => {
    measure("type 1 char mid-document", 30, () =>
      text.insertText(viewport, { xLine: 1, yLine: midLine }, "x")
    );
  });

  test("deleting one character", () => {
    // The path both Backspace and Delete take (Keys routes them through it).
    measure("backspace (deleteRangeText)", 30, () =>
      text.deleteRangeText(
        { xLine: 0, yLine: midLine },
        { xLine: 1, yLine: midLine }
      )
    );
  });

  test("pasting two paragraphs", () => {
    // Paste then undo the paste, so the document stays the same size across runs.
    measure("paste two paragraphs", 20, () => {
      text.insertText(
        viewport,
        { xLine: 0, yLine: midLine },
        "pasted first\npasted second\n"
      );
      text.deleteRangeText(
        { xLine: 0, yLine: midLine },
        { xLine: 0, yLine: midLine + 2 }
      );
    });
  });

  test("a recalculation with nothing changed", () => {
    measure("calculateLines, nothing changed", 20, () => text.calculateLines());
  });
});
