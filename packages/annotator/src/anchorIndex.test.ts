/**
 * Anchor pairs are indexed once per text state (see Text.getAnchorIndex): the
 * highlight pass reads every anchor of each entity in view on each frame.
 */
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

const mk = (raw: string) => {
  const text = new Text(raw, 1000);
  text.mode = EditMode.HIGHLIGHT;
  text.calculateLines();
  return text;
};

describe("anchor index", () => {
  test("getTagPositions lists every pair in getTagPosition's order", () => {
    const text = mk("<e1>a</e1>\n<e1>b <e1>c</e1></e1>\n</e1> <e1>d");
    const all = text.getTagPositions("e1");
    expect(all).toHaveLength(3);
    all.forEach((pos, i) => expect(pos).toEqual(text.getTagPosition("e1", i)));
    expect(text.getTagPosition("e1", 3)).toEqual([]);
    expect(text.countTags("e1")).toEqual({ opening: 4, closing: 4 });
  });

  test("a line range keeps only the anchors that reach into it", () => {
    const text = mk("<e1>a</e1>\nplain\n<e1>b\nc</e1>\nplain\n<e1>d</e1>");
    expect(text.getTagPositions("e1", 1, 1)).toEqual([]);
    expect(text.getTagPositions("e1", 3, 3)).toEqual([text.getTagPosition("e1", 1)]);
    expect(text.getTagPositions("e1", 0, 5)).toHaveLength(3);
  });

  test("an edit refreshes the pairs", () => {
    const text = mk("<e1>a</e1> b");
    expect(text.getTagPositions("e1")).toHaveLength(1);
    text.value = "<e1>a</e1> <e1>b</e1>";
    text.prepareSegments();
    text.calculateLines();
    expect(text.getTagPositions("e1")).toHaveLength(2);
    expect(text.countTags("e1")).toEqual({ opening: 2, closing: 2 });
  });
});
