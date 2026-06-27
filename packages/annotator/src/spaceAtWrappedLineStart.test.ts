import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

function keyDown(a: Annotator, key: string) {
  a.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent);
}

const MAXLEN = 10;
function setup(value: string): Annotator {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  document.body.appendChild(canvas);
  const a = new Annotator(canvas, "");
  a.setMode(EditMode.RAW);
  a.onReplaceText(value);
  a.text.updateCharsAtLine(MAXLEN);
  return a;
}

describe("space typed at the start of a wrapped word (#3145 follow-up)", () => {
  test("the extra wrap whitespace becomes a visible leading space and the caret moves", () => {
    const a = setup("aaaa bbbbb ccccc");
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe("ccccc");

    a.cursor.setPosition(0, 1); // start of "ccccc"
    keyDown(a, " ");

    expect(a.text.value).toBe("aaaa bbbbb  ccccc");
    // exactly one wrap-space stays trailing; the typed space leads line 1
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe(" ccccc");

    // caret visibly advanced past the inserted space
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("no visual line ever exceeds the wrap width by more than the single wrap space", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    keyDown(a, " ");
    keyDown(a, " ");
    keyDown(a, " ");
    for (let i = 0; i < a.text.noLines; i++) {
      expect(a.text.getLine(i).length).toBeLessThanOrEqual(MAXLEN + 1);
    }
  });

  test("single inter-word wrap space is unchanged (regression guard)", () => {
    const a = setup("aaaa bbbbb ccccc");
    // untouched layout: one trailing wrap space on line 0, word on line 1
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe("ccccc");
    expect(a.text.noLines).toBe(2);
  });
});
