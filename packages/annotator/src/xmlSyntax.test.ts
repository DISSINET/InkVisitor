import { tokenizeXmlLines, XmlTokenRun } from "./lib/XmlSyntax";

const kinds = (line: string, runs: XmlTokenRun[]) =>
  runs.map((r) => `${r.kind}:${line.slice(r.start, r.end)}`);

describe("tokenizeXmlLines (#3269)", () => {
  test("colours tag, attribute, quotes and value", () => {
    const line = 'a <w elvl="1">b</w>';
    const { runs } = tokenizeXmlLines([line]);
    expect(kinds(line, runs[0])).toEqual([
      "text:a ",
      "tag:<w",
      "text: ",
      "attr:elvl",
      "tag:=",
      'quote:"',
      "value:1",
      'quote:"',
      "tag:>",
      "text:b",
      "tag:</w>",
    ]);
  });

  test("entity anchor tags are tags", () => {
    const line = "<T0a1>x</T0a1>";
    const { runs } = tokenizeXmlLines([line]);
    expect(kinds(line, runs[0])).toEqual(["tag:<T0a1>", "text:x", "tag:</T0a1>"]);
  });

  test("a lone < in text stays text", () => {
    const line = "a < b";
    const { runs } = tokenizeXmlLines([line]);
    expect(kinds(line, runs[0])).toEqual(["text:a < b"]);
  });

  test("state carries across wrapped lines", () => {
    const lines = ['x <w lemma="long ', 'value" n="2">y'];
    const { runs } = tokenizeXmlLines(lines);
    expect(kinds(lines[1], runs[1])).toEqual([
      "value:value",
      'quote:"',
      "text: ",
      "attr:n",
      "tag:=",
      'quote:"',
      "value:2",
      'quote:"',
      "tag:>",
      "text:y",
    ]);
  });

  test("< at a line end peeks at the next line", () => {
    const { runs } = tokenizeXmlLines(["a <", "w>"]);
    expect(runs[0].map((r) => r.kind)).toEqual(["text", "tag"]);
    expect(runs[1].map((r) => r.kind)).toEqual(["tag"]);
  });
});
