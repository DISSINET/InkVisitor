import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string, cssWidth = "200px"): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = cssWidth;
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setParagraphIndent(false); // wrap geometry without the first-line indent
  a.setMode(EditMode.RAW);
  return a;
};

const selectedText = (a: Annotator): string => {
  const [start, end] = a.cursor.getAbsBounds();
  if (!start || !end) return "";
  return a.text.getRangeText(start, end);
};

const selectWordBar = (a: Annotator) => {
  a.onMouseDoubleClick({
    offsetX: 5 * (a.charWidth / a.ratio),
    offsetY: 0.5 * (a.lineHeight / a.ratio),
    preventDefault: () => {},
  } as unknown as MouseEvent);
};

describe("resize keeps selection on the same text (#3092)", () => {
  test("narrow-to-wide reflow does not change selected text", () => {
    const text = "foo bar baz qux quux corge";
    const a = mk(text, "120px");
    selectWordBar(a);
    expect(selectedText(a)).toBe("bar");

    a.element.style.width = "800px";
    a.resize();

    expect(selectedText(a)).toBe("bar");
  });

  test("wide-to-narrow reflow does not change selected text", () => {
    const text = "foo bar baz qux quux corge";
    const a = mk(text, "800px");
    selectWordBar(a);
    expect(selectedText(a)).toBe("bar");

    a.element.style.width = "120px";
    a.resize();

    expect(selectedText(a)).toBe("bar");
  });
});

describe("resize keeps the text at the top of the viewport", () => {
  const paragraphs = Array.from(
    { length: 120 },
    (_, i) => `p${i + 1} alpha beta gamma delta epsilon zeta eta theta iota kappa`,
  );
  const text = paragraphs.join("\n");
  const topLineText = (a: Annotator): string =>
    a.text.value.slice(a.text.offsetFromVisual(0, a.viewport.lineStart));

  test.each([
    ["wide to narrow", "800px", "100px"],
    ["narrow to wide", "100px", "800px"],
  ])("%s reflow keeps the same paragraph on top", (_label, from, to) => {
    const a = mk(text, from);
    a.scrollToParagraph(60);
    expect(topLineText(a).startsWith("p60 ")).toBe(true);

    a.element.style.width = to;
    a.resize();

    expect(topLineText(a).startsWith("p60 ")).toBe(true);
  });
});
