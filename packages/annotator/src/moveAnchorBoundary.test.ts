/**
 * Tests for moveAnchorBoundary (issue #2885): nudging an existing anchor's
 * opening/closing tag one visible character left/right through the raw text.
 */

import { Annotator } from "./lib/Annotator";
import { HighlightMode } from "./lib/constants";

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  return canvas;
};

const createAnnotator = (text: string): Annotator => {
  const canvas = createMockCanvas();
  document.body.appendChild(canvas);
  return new Annotator(canvas, text);
};

describe("moveAnchorBoundary — basic moves", () => {
  // "abc <e1>def</e1> ghi": <e1> at abs 4, </e1> at abs 11
  const TEXT = "abc <e1>def</e1> ghi";
  const REF = { segmentIndex: 0, position: 4 };

  test("open tag moves one character left (span grows left)", () => {
    const annotator = createAnnotator(TEXT);
    const result = annotator.moveAnchorBoundary("e1", REF, "open", -1);
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("abc<e1> def</e1> ghi");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 3 });
  });

  test("open tag moves one character right (span shrinks)", () => {
    const annotator = createAnnotator(TEXT);
    const result = annotator.moveAnchorBoundary("e1", REF, "open", 1);
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("abc d<e1>ef</e1> ghi");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 5 });
  });

  test("close tag moves one character right (span grows right)", () => {
    const annotator = createAnnotator(TEXT);
    const result = annotator.moveAnchorBoundary("e1", REF, "close", 1);
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("abc <e1>def </e1>ghi");
    // opening tag did not move
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 4 });
  });

  test("close tag moves one character left (span shrinks)", () => {
    const annotator = createAnnotator(TEXT);
    const result = annotator.moveAnchorBoundary("e1", REF, "close", -1);
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("abc <e1>de</e1>f ghi");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 4 });
  });

  test("repeated moves chain via the returned openTagRef", () => {
    const annotator = createAnnotator(TEXT);
    const first = annotator.moveAnchorBoundary("e1", REF, "open", -1);
    expect(first.status).toBe("moved");
    const second = annotator.moveAnchorBoundary("e1", first.openTagRef!, "open", -1);
    expect(second.status).toBe("moved");
    expect(annotator.text.value).toBe("ab<e1>c def</e1> ghi");
    expect(second.openTagRef).toEqual({ segmentIndex: 0, position: 2 });
  });

  test("moved span becomes the current selection (visual feedback)", () => {
    const annotator = createAnnotator(TEXT);
    annotator.moveAnchorBoundary("e1", REF, "open", -1);
    expect((annotator as any).cursor.selectStart).not.toBeNull();
    expect((annotator as any).cursor.selectEnd).not.toBeNull();
  });
});

describe("moveAnchorBoundary — markup interaction", () => {
  test("expanding left across another entity's closing tag absorbs it (overlap is legal)", () => {
    // <e2> spans "cd", <e1> spans "ef", tags directly adjacent
    const annotator = createAnnotator("ab <e2>cd</e2><e1>ef</e1>");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 14 },
      "open",
      -1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("ab <e2>c<e1>d</e2>ef</e1>");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 8 });
  });

  test("shrinking from the left keeps existing nesting intact", () => {
    // <e1> wraps "a<e2>bc</e2>"; moving its open right must not cross <e2>
    const annotator = createAnnotator("<e1>a<e2>bc</e2></e1> d");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 0 },
      "open",
      1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("a<e1><e2>bc</e2></e1> d");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 1 });
  });

  test("open tag crosses a newline into the previous line", () => {
    const annotator = createAnnotator("ab\n<e1>cd</e1>");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 1, position: 0 },
      "open",
      -1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("ab<e1>\ncd</e1>");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 2 });
  });

  test("literal '>' in text is stepped over as an ordinary character", () => {
    const annotator = createAnnotator("a>b <e1>c</e1>");
    const ref = { segmentIndex: 0, position: 4 };
    let result = annotator.moveAnchorBoundary("e1", ref, "open", -1);
    expect(result.status).toBe("moved");
    result = annotator.moveAnchorBoundary("e1", result.openTagRef!, "open", -1);
    expect(result.status).toBe("moved");
    result = annotator.moveAnchorBoundary("e1", result.openTagRef!, "open", -1);
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("a<e1>>b c</e1>");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 1 });
  });
});

describe("moveAnchorBoundary — guards", () => {
  test("open tag cannot move left past the document start", () => {
    const annotator = createAnnotator("<e1>ab</e1>");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 0 },
      "open",
      -1
    );
    expect(result.status).toBe("blocked-bounds");
    expect(annotator.text.value).toBe("<e1>ab</e1>");
  });

  test("close tag cannot move right past the document end", () => {
    const annotator = createAnnotator("<e1>ab</e1>");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 0 },
      "close",
      1
    );
    expect(result.status).toBe("blocked-bounds");
    expect(annotator.text.value).toBe("<e1>ab</e1>");
  });

  test("span cannot shrink below one visible character (open side)", () => {
    const annotator = createAnnotator("x <e1>a</e1> y");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 2 },
      "open",
      1
    );
    expect(result.status).toBe("blocked-bounds");
    expect(annotator.text.value).toBe("x <e1>a</e1> y");
  });

  test("span cannot shrink below one visible character (close side)", () => {
    const annotator = createAnnotator("x <e1>a</e1> y");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 2 },
      "close",
      -1
    );
    expect(result.status).toBe("blocked-bounds");
    expect(annotator.text.value).toBe("x <e1>a</e1> y");
  });

  test("crossing a tag with the same name is refused", () => {
    // two anchors of the same entity, directly adjacent
    const annotator = createAnnotator("<e1>ab</e1><e1> cd</e1>");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 11 },
      "open",
      -1
    );
    expect(result.status).toBe("blocked-same-name");
    expect(annotator.text.value).toBe("<e1>ab</e1><e1> cd</e1>");
  });

  test("targets the right anchor when the same entity is anchored twice", () => {
    const annotator = createAnnotator("<e1>ab</e1> <e1>cd</e1> x");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 12 },
      "close",
      1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("<e1>ab</e1> <e1>cd </e1>x");
    // the opening tag of the second anchor did not move
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 12 });
  });

  test("asymmetrical anchor (no closing tag) → not-found, text unchanged", () => {
    const annotator = createAnnotator("<e1>ab");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 0 },
      "open",
      -1
    );
    expect(result.status).toBe("not-found");
    expect(annotator.text.value).toBe("<e1>ab");
  });

  test("unknown tag name → not-found", () => {
    const annotator = createAnnotator("plain text only");
    const result = annotator.moveAnchorBoundary(
      "e9",
      { segmentIndex: 0, position: 0 },
      "open",
      -1
    );
    expect(result.status).toBe("not-found");
  });

  test("stale ref falls back to the nearest same-name opening tag", () => {
    const annotator = createAnnotator("x <e1>ab</e1> y");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 999 },
      "open",
      -1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("x<e1> ab</e1> y");
    expect(result.openTagRef).toEqual({ segmentIndex: 0, position: 1 });
  });

  test("attributes survive verbatim, including nonstandard spacing and quotes", () => {
    const annotator = createAnnotator("a <e1  elvl='2'>bc</e1> d");
    const result = annotator.moveAnchorBoundary(
      "e1",
      { segmentIndex: 0, position: 2 },
      "open",
      -1
    );
    expect(result.status).toBe("moved");
    expect(annotator.text.value).toBe("a<e1  elvl='2'> bc</e1> d");
  });
});

describe("anchor resize mode (#2885)", () => {
  const TEXT = "abc <e1>def</e1> ghi";
  const REF = { segmentIndex: 0, position: 4 };

  test("beginAnchorResize hides the selection without reporting it", () => {
    const annotator = createAnnotator(TEXT);
    // Seed a selection and register a spy so we can prove it's suppressed.
    const selections: Array<{ text: string }> = [];
    annotator.onSelectText((s) => selections.push({ text: s.text }));
    (annotator as any).cursor.selectStart = { xLine: 4, yLine: 0 };
    (annotator as any).cursor.selectEnd = { xLine: 7, yLine: 0 };
    (annotator as any).cursor.setTrueSelectionDirection();

    selections.length = 0;
    annotator.beginAnchorResize("e1", REF);

    // The draw during begin must NOT emit an onSelectText event (selection frozen/hidden).
    expect(selections).toHaveLength(0);
    expect((annotator as any).selectionHidden).toBe(true);
    // The cursor bounds are preserved (position "saved") for later restoration.
    expect((annotator as any).cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect((annotator as any).cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
  });

  test("moveAnchorBoundary in resize mode does not touch the cursor selection", () => {
    const annotator = createAnnotator(TEXT);
    (annotator as any).cursor.selectStart = { xLine: 4, yLine: 0 };
    (annotator as any).cursor.selectEnd = { xLine: 7, yLine: 0 };
    (annotator as any).cursor.setTrueSelectionDirection();

    annotator.beginAnchorResize("e1", REF);
    const result = annotator.moveAnchorBoundary("e1", REF, "open", -1);

    expect(result.status).toBe("moved");
    // Text changed, but the frozen selection bounds are untouched.
    expect(annotator.text.value).toBe("abc<e1> def</e1> ghi");
    expect((annotator as any).cursor.selectStart).toEqual({ xLine: 4, yLine: 0 });
    expect((annotator as any).cursor.selectEnd).toEqual({ xLine: 7, yLine: 0 });
  });

  test("endAnchorResize unhides the selection and clears resize state", () => {
    const annotator = createAnnotator(TEXT);
    annotator.beginAnchorResize("e1", REF);
    expect((annotator as any).selectionHidden).toBe(true);

    const selections: Array<{ text: string }> = [];
    annotator.onSelectText((s) => selections.push({ text: s.text }));
    annotator.endAnchorResize();

    expect((annotator as any).selectionHidden).toBe(false);
    expect((annotator as any).resizeAnchor).toBeNull();
  });
});

describe("resize pulse schemas (#2885)", () => {
  const TEXT = "abc <e1>def</e1> ghi";

  const schemasFor = (annotator: Annotator, tagName: string) =>
    (annotator as any).getResizePulseSchemas(tagName) as Array<{
      mode: string;
      style: { color: string; opacity: number };
    }>;

  test("a plain background entity pulses its own fill only", () => {
    const annotator = createAnnotator(TEXT);
    annotator.onHighlight(() => ({
      mode: HighlightMode.BACKGROUND,
      style: { color: "#f00", opacity: 0.4 },
    }));
    const schemas = schemasFor(annotator, "e1");
    expect(schemas.map((s) => s.mode)).toEqual([HighlightMode.BACKGROUND]);
  });

  test("an underline entity (Statement) also gets a background wash", () => {
    const annotator = createAnnotator(TEXT);
    annotator.onHighlight(() => ({
      mode: HighlightMode.UNDERLINE,
      style: { color: "#0a0", opacity: 1 },
    }));
    const schemas = schemasFor(annotator, "e1");
    expect(schemas.map((s) => s.mode)).toEqual([
      HighlightMode.UNDERLINE,
      HighlightMode.BACKGROUND,
    ]);
    // wash borrows the entity's class colour
    expect(schemas[1].style.color).toBe("#0a0");
  });

  test("an anchor-only entity (Territory) gets a background wash", () => {
    const annotator = createAnnotator(TEXT);
    annotator.onHighlight(() => ({
      mode: HighlightMode.ANCHOR,
      style: { color: "#00f", opacity: 1 },
    }));
    const schemas = schemasFor(annotator, "e1");
    expect(schemas.map((s) => s.mode)).toEqual([HighlightMode.BACKGROUND]);
    expect(schemas[0].style.color).toBe("#00f");
  });

  test("active territory ([FOCUS, ANCHOR]) pulses a non-inverted background wash", () => {
    // FOCUS dims everything OUTSIDE the span (inverted highlight); during resize
    // that reads backwards, so it pulses as a normal BACKGROUND wash on the span.
    const annotator = createAnnotator(TEXT);
    annotator.onHighlight(() => [
      { mode: HighlightMode.FOCUS, style: { color: "#00f", opacity: 0.1 } },
      { mode: HighlightMode.ANCHOR, style: { color: "#00f", opacity: 1 } },
    ]);
    const schemas = schemasFor(annotator, "e1");
    expect(schemas.map((s) => s.mode)).toEqual([HighlightMode.BACKGROUND]);
    expect(schemas[0].style.color).toBe("#00f");
  });

  test("no highlight schema yields no pulse schemas", () => {
    const annotator = createAnnotator(TEXT);
    annotator.onHighlight(() => undefined);
    expect(schemasFor(annotator, "e1")).toEqual([]);
  });
});
