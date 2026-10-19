/**
 * Self-closing tags (`<example/>`, `<example />`, `<e1 id="1"/>`) are complete
 * on their own, so the asymmetrical-anchor check (#3306) must not report them
 * as orphaned opening tags.
 */
import { Annotator } from "./lib/Annotator";
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

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

describe("getTagPosition with self-closing tags", () => {
  test("a self-closing tag is not paired with the closing tag of a later anchor", () => {
    const text = new Text("<e1 /> intro <e1>focus</e1>", 1000);
    const segment = text.segments[0];
    const pairedOpening = segment.openingTags.find((tag) => !tag.selfClosing)!;
    const start = segment.findTagParsedPosition(pairedOpening);

    expect(text.getTagPosition("e1", 0)[0]).toEqual({ xLine: start.x, yLine: start.y });
    expect(text.getTagPosition("e1", 1)).toEqual([]);
  });
});

describe("scrollToAnchor with self-closing tags", () => {
  test("occurrence indexes skip self-closing tags, as highlights do", () => {
    const canvas = document.createElement("canvas");
    canvas.style.width = "800px";
    canvas.style.height = "600px";
    document.body.appendChild(canvas);
    const a = new Annotator(canvas, "");
    a.setMode(EditMode.RAW);
    const raw = "<e1 /> intro <e1>A</e1> mid <e1>B</e1>";
    a.onReplaceText(raw);

    a.scrollToAnchor("e1", 1);
    expect([a.cursor.xLine, a.cursor.yLine]).toEqual([raw.indexOf("B"), 0]);
  });
});

describe("getTagPosition pairs tags in document order", () => {
  test("a closing tag before its opening tag pairs with nothing", () => {
    const text = new Text("</T1> intro <T1> rest", 1000);

    expect(text.getTagPosition("T1", 0)).toEqual([]);
  });

  // positions are in the parsed text, with tags removed
  test("an orphaned closing tag does not shift the pairing of a later anchor", () => {
    const text = new Text("</e1> a <e1>A</e1>", 1000);

    // parsed " a A": the anchor wraps the "A" at 3
    expect(text.getTagPosition("e1", 0)).toEqual([
      { xLine: 3, yLine: 0 },
      { xLine: 4, yLine: 0 },
    ]);
    expect(text.getTagPosition("e1", 1)).toEqual([]);
  });

  test("a nested anchor of the same name follows the one around it", () => {
    const text = new Text("<e1>x<e1>y</e1>z</e1>", 1000);

    // parsed "xyz": the outer anchor wraps all of it, the inner one "y"
    expect(text.getTagPosition("e1", 0)).toEqual([
      { xLine: 0, yLine: 0 },
      { xLine: 3, yLine: 0 },
    ]);
    expect(text.getTagPosition("e1", 1)).toEqual([
      { xLine: 1, yLine: 0 },
      { xLine: 2, yLine: 0 },
    ]);
  });
});
