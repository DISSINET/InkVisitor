import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

/** Punctuation that must never be the first character of a wrapped line. */
const LEADING_PUNCT = /^[,.;:!?)\]}»”’%]/;

describe("line wrapping - punctuation must not start a wrapped line", () => {
  test("comma after a word stays on the previous wrapped line", () => {
    // charsAtLine = 10. "aaaaaaaaa" (9) + ", " + "bbbb".
    // Naive tokenization breaks before ", ", putting the comma at line start.
    const text = new Text("aaaaaaaaa, bbbb", 10);
    const lines = text.segments[0].lines;

    expect(lines).toEqual(["aaaaaaaaa, ", "bbbb"]);
  });

  test("no wrapped line begins with punctuation across many break points", () => {
    const input =
      "alpha, beta. gamma; delta: epsilon! zeta? eta) theta word longerword";
    const text = new Text(input, 12);
    const lines = text.segments[0].lines;

    for (let i = 1; i < lines.length; i++) {
      expect(LEADING_PUNCT.test(lines[i])).toBe(false);
    }
    // Wrapping only moves break points; it never adds/drops characters.
    expect(lines.join("")).toBe(input);
  });

  test("a lone space (no punctuation) may still wrap so typing keeps advancing", () => {
    // Only punctuation is forbidden at a line start; a whitespace break is kept
    // so typing a space at the end of a full line advances to the next line
    // (see typingAtLineEnd.test.ts).
    const text = new Text("aaaaaaaaaa bbbb", 10);
    const lines = text.segments[0].lines;

    expect(lines).toEqual(["aaaaaaaaaa", " bbbb"]);
    expect(lines.join("")).toBe("aaaaaaaaaa bbbb");
  });

  test("indices round-trip on an overflow line created by trailing punctuation", () => {
    // The word fills the line and the comma overflows charsAtLine, so line 0 is
    // longer than charsAtLine. Every character index must still map (line,char)
    // <-> absolute index correctly, since the fix only moves break points.
    const input = "aaaaaaaaaa, bbbb";
    const text = new Text(input, 10);
    const lines = text.segments[0].lines;

    // line 0 genuinely exceeds charsAtLine (the comma+space overflow)
    expect(lines[0].length).toBeGreaterThan(10);

    // Single segment, so the absolute index equals the raw index throughout.
    for (let i = 0; i <= input.length; i++) {
      const pos = text.getSegmentFromAbsTextIndex(i);
      expect(pos).not.toBeNull();
      expect(text.getAbsTextIndexFromPosition(pos)).toBe(i);
    }
  });

  test("highlight mode (tags stripped) also keeps punctuation off line starts", () => {
    const text = new Text("<x>aaaaaaaaa</x>, bbbb", 10);
    text.mode = EditMode.HIGHLIGHT;
    text.calculateLines();
    const lines = text.segments[0].lines;

    for (let i = 1; i < lines.length; i++) {
      expect(LEADING_PUNCT.test(lines[i])).toBe(false);
    }
    expect(lines.join("")).toBe("aaaaaaaaa, bbbb");
  });
});
