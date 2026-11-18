/**
 * Issue #3435 — hovering tag markup in RAW mode reports the entity tag on both
 * the opening and the closing tag of an anchor, orphaned closing tags included.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

// The pointer-to-text mapping depends on canvas metrics jsdom does not have,
// so the hovered raw index is fed in directly.
const hoverAtRawIndex = (a: Annotator, rawTextIndex: number) => {
  const hoverCb = jest.fn();
  a.onAnchorTagHover(hoverCb);
  jest
    .spyOn((a as any).text, "getSegmentPosition")
    .mockReturnValue({ segmentIndex: 0, rawTextIndex });
  (a as any).detectAndEmitAnchorTagHover({
    offsetX: 0,
    offsetY: 0,
    pageX: 111,
    pageY: 222,
  } as MouseEvent);
  return hoverCb;
};

// "foo " 0-3, "<T1>" 4-7, "bar" 8-10, "</T1>" 11-15, " baz " 16-20, "</T2>" 21-25
const text = "foo <T1>bar</T1> baz </T2>";

describe("anchor tag hover in RAW mode (#3435)", () => {
  test.each([
    ["opening tag", 5, "T1"],
    ["paired closing tag", 13, "T1"],
    ["orphaned closing tag", 23, "T2"],
  ])("hovering the %s reports its entity tag", (_label, index, tagName) => {
    const hoverCb = hoverAtRawIndex(mk(text), index);
    expect(hoverCb).toHaveBeenCalledTimes(1);
    const [tag, pos] = hoverCb.mock.calls[0];
    expect(tag.getTagName()).toBe(tagName);
    expect(pos).toEqual({ x: 111, y: 222 });
  });

  test("hovering plain text reports no tag", () => {
    const hoverCb = hoverAtRawIndex(mk(text), 18);
    expect(hoverCb).toHaveBeenCalledWith(null, null);
  });
});
