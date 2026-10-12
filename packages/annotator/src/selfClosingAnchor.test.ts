/**
 * Self-closing tags (`<example/>`, `<example />`, `<e1 id="1"/>`) are complete
 * on their own, so the asymmetrical-anchor check (#3306) must not report them
 * as orphaned opening tags.
 */
import Text from "./lib/Text";

const validate = (raw: string) => new Text(raw, 1000).validateAnchors();

describe("validateAnchors with self-closing tags", () => {
  test.each([
    ["no space", "before <example/> after"],
    ["space before slash", "before <example /> after"],
    ["with attributes", 'before <e1 id="1"/> after'],
    ["with attributes and space", 'before <e1 id="1" /> after'],
  ])("a self-closing tag (%s) is not an orphan", (_label, raw) => {
    expect(validate(raw)).toEqual([]);
  });

  test("a self-closing tag inside a matched pair of the same name is not an orphan", () => {
    expect(validate("<e1>text <e1/> more</e1>")).toEqual([]);
  });

  test("a real orphaned opening tag next to a self-closing one is still reported", () => {
    expect(validate("<e1/> text <e1> more")).toEqual([
      expect.objectContaining({ tagName: "e1", type: "orphaned-opening", position: 11 }),
    ]);
  });
});
