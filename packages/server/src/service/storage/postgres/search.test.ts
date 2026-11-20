import { labelPattern } from "../../../common/searchLabel";

const BREAK = "[^a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]";
const GLUE = `(${BREAK}+[a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F_]+)*${BREAK}+`;

describe("labelPattern", () => {
  it("adds word boundaries on a side without a wildcard and glue between words", () => {
    expect(labelPattern("ab cd", "^", "$")).toBe(
      `(?i)(^|${BREAK})[aàáâãäå]b${GLUE}[cçč][dď]($|${BREAK})`
    );
    expect(labelPattern("ab cd", "", "")).toBe(`(?i)[aàáâãäå]b${GLUE}[cçč][dď]`);
    expect(labelPattern("Ab", "^", "")).toBe(`(?i)(^|${BREAK})[aàáâãäå]b`);
  });

  it("reads regex characters literally", () => {
    expect(labelPattern("(.", "", "")).toBe("(?i)\\(\\.");
    expect(labelPattern("\\s", "", "")).toBe("(?i)\\\\[sš]");
  });

  it("keeps every quote mark out of the word letters", () => {
    const wordBreak = new RegExp(BREAK);
    const quotes = "\u0027\u2018\u2019\u201A\u201B\u2039\u203A\u02BC\u02BB\u0060\u00B4\u2032\uFF07";
    const doubles = "\u0022\u201C\u201D\u201E\u201F\u00AB\u00BB\u2033\uFF02";
    for (const char of quotes + doubles) {
      expect(wordBreak.test(char)).toBe(true);
    }
  });
});
