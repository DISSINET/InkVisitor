/**
 * Multianchor relies on addAnchor re-selecting the span it just wrapped: the
 * next call then wraps the previous result instead of the bare text, so a list
 * of entities nests with the first one outermost.
 *
 * Highlight mode is required. In raw mode the re-selection is not adjusted for
 * the tag characters just inserted, so a second call wraps a shifted span.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createAnnotator = (text: string): Annotator => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  document.body.appendChild(canvas);
  const a = new Annotator(canvas, text);
  a.setMode(EditMode.HIGHLIGHT);
  return a;
};

const selectPhrase = (a: Annotator) => {
  a.cursor.selectStart = { xLine: 0, yLine: 0 };
  a.cursor.selectEnd = { xLine: 15, yLine: 0 };
  a.cursor.setTrueSelectionDirection();
};

describe("addAnchor — consecutive calls on one selection", () => {
  // "stupid heretics" occupies columns 0..15
  const TEXT = "stupid heretics burned";

  test("second anchor nests inside the first, both covering the whole span", () => {
    const a = createAnnotator(TEXT);
    selectPhrase(a);

    a.addAnchor("G");
    a.addAnchor("C");

    expect(a.text.value).toBe("<G><C>stupid heretics</C></G> burned");
  });

  test("a single-entity list still produces one anchor", () => {
    const a = createAnnotator(TEXT);
    selectPhrase(a);

    a.addAnchor("G");

    expect(a.text.value).toBe("<G>stupid heretics</G> burned");
  });
});
