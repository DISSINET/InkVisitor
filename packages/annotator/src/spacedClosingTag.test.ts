/**
 * A closing tag may carry whitespace before its ">" (`</sic >`), as in texts
 * imported from other tools (#3312). It closes its anchor like `</sic>`, and
 * edits that cut tags out of the raw text use its real length.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";
import Text from "./lib/Text";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

describe("closing tag with whitespace before >", () => {
  test("is parsed as a closing tag with its length in the text", () => {
    const segment = new Text("<sic>a</sic >", 1000).segments[0];
    expect(
      segment.closingTags.map((tag) => [tag.getTagName(), tag.position, tag.getTagLength()])
    ).toEqual([["sic", 6, 7]]);
    expect(segment.parsed).toBe("a");
  });

  test("closes its anchor in the asymmetrical check", () => {
    const issues = new Text('<sic rend="x">a</sic > <sic rend="y">b', 1000).validateAnchors();
    expect(issues.map(({ type, position }) => ({ type, position }))).toEqual([
      { type: "orphaned-opening", position: 23 },
    ]);
  });

  test("removing the anchor removes the whole closing tag", () => {
    const a = mk("x <sic>a</sic > y");
    a.removeAnchorFromSelection(a.text.segments[0].openingTags[0]);
    expect(a.text.value).toBe("x a y");
  });

  test("Cmd+Backspace right after it deletes the whole tag", () => {
    const a = mk("ab<T1>cd</T1 >");
    a.cursor.setPosition(14, 0);
    a.keys.onKeyDown({
      key: "Backspace",
      ctrlKey: false,
      metaKey: true,
      altKey: false,
      shiftKey: false,
      code: "",
      preventDefault: () => {},
    } as KeyboardEvent);
    expect(a.text.value).toBe("ab<T1>cd");
  });
});
