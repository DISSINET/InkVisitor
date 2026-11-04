/**
 * Asymmetrical-anchor issues carry the paragraph number the gutter shows
 * (#3306), so the warnings panel and the gutter name the same paragraph.
 */
import Text from "./lib/Text";
import { AsymmetricalAnchor, Warnings } from "./lib/warnings";

const paragraphs = (raw: string) =>
  new Text(raw, 1000).validateAnchors().map((issue) => issue.paragraphNumber);

describe("paragraph number of an asymmetrical anchor", () => {
  test("skips empty paragraphs the way the gutter does", () => {
    expect(paragraphs("first\n\n<x>third")).toEqual([2]);
  });

  test("is unset on a tag-only paragraph, which the gutter leaves unnumbered", () => {
    expect(paragraphs("first\n<x>\nthird")).toEqual([undefined]);
  });

  test("a changed paragraph number re-emits the warning", () => {
    const warnings = new Warnings();
    const received: AsymmetricalAnchor[][] = [];
    warnings.onWarning((warning) => received.push(warning.anchors));
    const anchor: AsymmetricalAnchor = {
      tagName: "x",
      type: "orphaned-opening",
      segmentIndex: 2,
      position: 0,
      paragraphNumber: 2,
    };

    warnings.emitAsymmetricalAnchors([anchor]);
    warnings.emitAsymmetricalAnchors([{ ...anchor, paragraphNumber: 1 }]);

    expect(received.map((anchors) => anchors[0].paragraphNumber)).toEqual([2, 1]);
  });
});
