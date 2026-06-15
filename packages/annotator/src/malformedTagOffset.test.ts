/**
 * Regression: raw→parsed offset mapping must stay consistent with how `parsed`
 * is actually built (`raw.replace(tagRemovalRegex, "")`), including for
 * malformed tags that the strict opening/closing regexes never track.
 *
 * `</first elvl="1">` is a closing tag carrying attributes. tagRemovalRegex
 * strips it from `parsed`, but it matches neither `openingTagRegex` nor
 * `closingTagRegex`, so it lands in neither `openingTags` nor `closingTags`.
 * The old converter reconstructed the removed length from those lists and so
 * (a) missed this tag entirely and (b) would have used the attribute-stripped
 * `</first>` length even if it had tracked it — overshooting parsedTextIndex
 * past the end of `parsed`. See getSegmentFromAbsTextIndex in Text.ts.
 */
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";

const RAW = 'ad asdadas<first><test>fdsds </test></first elvl="1"> dfsd  ';

describe("raw→parsed offset mapping with a malformed (attribute-bearing) closing tag", () => {
  test("a raw offset after the malformed tag maps onto the matching parsed text", () => {
    // Wide line so each segment stays on one line (no wrapping noise).
    const text = new Text(RAW, 1000);
    text.mode = EditMode.HIGHLIGHT;
    text.prepareSegments();
    text.calculateLines();

    const parsed = text.segments[0].parsed;
    // The malformed closing tag is stripped from parsed just like a normal tag.
    expect(parsed).toBe("ad asdadasfdsds  dfsd  ");

    // Raw index of the space immediately before "dfsd" (just past the "> ").
    const rawIndex = RAW.indexOf("> ") + 1;
    const pos = text.getSegmentFromAbsTextIndex(rawIndex);
    expect(pos).not.toBeNull();

    // Must land on the " dfsd" run in parsed, not past the end of it.
    expect(parsed.slice(pos!.parsedTextIndex, pos!.parsedTextIndex + 5)).toBe(
      " dfsd"
    );
  });

  test("well-formed tags map identically (no behavior change for the common case)", () => {
    const wellFormed = "<p>Hello world</p>";
    const text = new Text(wellFormed, 1000);
    text.mode = EditMode.HIGHLIGHT;
    text.prepareSegments();
    text.calculateLines();

    // Raw index of 'w' in "world" (after "<p>Hello ").
    const rawIndex = wellFormed.indexOf("world");
    const pos = text.getSegmentFromAbsTextIndex(rawIndex);
    expect(pos).not.toBeNull();
    expect(text.segments[0].parsed.slice(pos!.parsedTextIndex)).toBe("world");
  });
});
