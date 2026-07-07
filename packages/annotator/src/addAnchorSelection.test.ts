/**
 * Regression test: adding an anchor for an entity that is ALREADY anchored
 * elsewhere in the document must leave the selection on the newly created
 * occurrence, not jump back to the first occurrence.
 *
 * Bug: addAnchor selected getTagPosition(name, 0) — hardcoded first occurrence —
 * so the highlight visibly jumped to the entity's first anchor in the document.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createAnnotator = (text: string): Annotator => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  document.body.appendChild(canvas);
  const a = new Annotator(canvas, text);
  a.setMode(EditMode.RAW);
  return a;
};

describe("addAnchor — entity already anchored in the document", () => {
  // raw indices: "ddd" occupies 21..23, selection end at 24
  const TEXT = "aaa <e1>bbb</e1> ccc ddd";

  test("selection lands on the newly created anchor, not the first occurrence", () => {
    const a = createAnnotator(TEXT);
    a.cursor.selectStart = { xLine: 21, yLine: 0 };
    a.cursor.selectEnd = { xLine: 24, yLine: 0 };
    a.cursor.setTrueSelectionDirection();

    a.addAnchor("e1");

    // a second anchor was created around "ddd"
    expect(a.text.value).toBe("aaa <e1>bbb</e1> ccc <e1>ddd</e1>");

    const first = a.text.getTagPosition("e1", 0);
    const second = a.text.getTagPosition("e1", 1);
    expect(second.length).toBe(2);

    // selection must be on the NEW (second) occurrence, not the first
    expect(a.cursor.selectStart).toEqual(second[0]);
    expect(a.cursor.selectEnd).toEqual(second[1]);
    expect(a.cursor.selectStart).not.toEqual(first[0]);
  });
});
