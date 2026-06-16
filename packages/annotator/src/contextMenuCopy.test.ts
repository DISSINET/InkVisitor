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

const selectWordBar = (a: Annotator) => {
  a.onMouseDoubleClick({
    offsetX: 5 * (a.charWidth / a.ratio),
    offsetY: 0.5 * (a.lineHeight / a.ratio),
    preventDefault: () => {},
  } as unknown as MouseEvent);
};

describe("context menu Copy / Paste (#3092)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("Paste is always shown; Copy only when a highlight is active", () => {
    const a = mk("foo bar baz");
    expect(a.isHighlighting()).toBe(false);

    a.onContextMenu({
      clientX: 100,
      clientY: 100,
      preventDefault: () => {},
    } as MouseEvent);
    expect(document.body.textContent).toContain("Paste");
    expect(document.body.textContent).not.toContain("Copy");
    a.contextMenu.close();

    selectWordBar(a);
    expect(a.isHighlighting()).toBe(true);

    a.onContextMenu({
      clientX: 100,
      clientY: 100,
      preventDefault: () => {},
    } as MouseEvent);
    expect(document.body.textContent).toContain("Copy");
    expect(document.body.textContent).toContain("Paste");
  });

  test("Copy writes the highlighted text to the clipboard", () => {
    const writeText = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const a = mk("foo bar baz");
    selectWordBar(a);
    a.onCopyText();

    expect(writeText).toHaveBeenCalledWith("bar");
  });

  test("Paste replaces the highlighted text with clipboard content", async () => {
    Object.assign(navigator, {
      clipboard: {
        readText: jest.fn().mockResolvedValue("QUX"),
        writeText: jest.fn(),
      },
    });

    const a = mk("foo bar baz");
    selectWordBar(a);
    a.onPasteText();
    await new Promise((r) => setTimeout(r, 0));

    expect(a.text.value).toBe("foo QUX baz");
    expect(a.isHighlighting()).toBe(false);
  });
});
