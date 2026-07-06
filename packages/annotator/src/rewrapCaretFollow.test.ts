import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "600px";
  return canvas;
};

function keyDown(annotator: Annotator, key: string) {
  annotator.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent);
}

// Force a narrow, exact line budget so wrap math is deterministic.
const MAXLEN = 10;
function setup(value: string): Annotator {
  const canvas = createMockCanvas();
  document.body.appendChild(canvas);
  const a = new Annotator(canvas, "");
  a.setMode(EditMode.RAW);
  a.onReplaceText(value);
  a.text.updateCharsAtLine(MAXLEN);
  return a;
}

describe("caret follows the word across a re-wrap", () => {
  test("layout sanity: word wraps to line 1", () => {
    const a = setup("aa bbbb cccccc");
    expect(a.text.getLine(0)).toBe("aa bbbb ");
    expect(a.text.getLine(1)).toBe("cccccc");
  });

  test("BACKSPACE that un-wraps a word: caret follows the word up to line 0", () => {
    // "bbbbbbbb" (8) does not fit after "aa " on a 10-char line, so it wraps.
    const a = setup("aa bbbbbbbb");
    expect(a.text.getLine(0)).toBe("aa ");
    expect(a.text.getLine(1)).toBe("bbbbbbbb");

    // caret at the END of the wrapped word on visual line 1 (col 8)
    a.cursor.setPosition(8, 1);

    keyDown(a, "Backspace");

    // one b deleted -> "aa bbbbbbb" (7 b's) now fits on a single line
    expect(a.text.value).toBe("aa bbbbbbb");
    expect(a.text.noLines).toBe(1);

    // caret must jump WITH the word up to line 0 (end of text, col 10)
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(10);

    // invariant: cached visual caret is consistent with its raw offset
    expect(a.text.offsetFromVisual(a.cursor.xLine, a.cursor.yLine)).toBe(
      a.cursor.head
    );
  });

  test("DELETE that un-wraps a word: caret follows the word up to line 0", () => {
    const a = setup("aa bbbbbbbb");
    expect(a.text.getLine(1)).toBe("bbbbbbbb");

    // caret at the START of the wrapped word on visual line 1
    a.cursor.setPosition(0, 1);

    keyDown(a, "Delete");

    // first b deleted -> "aa bbbbbbb" (7 b's) now fits on a single line
    expect(a.text.value).toBe("aa bbbbbbb");
    expect(a.text.noLines).toBe(1);

    // caret must jump WITH the word up to line 0 (col 3, the first remaining b)
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(3);

    expect(a.text.offsetFromVisual(a.cursor.xLine, a.cursor.yLine)).toBe(
      a.cursor.head
    );
  });

  test("BACKSPACE at the start of a wrapped word deletes the boundary space", () => {
    const a = setup("aaaa bbbbb ccccc");
    // line 0 fills exactly; the wrap space trails it and "ccccc" starts line 1
    // flush (column 0), no leading space.
    expect(a.text.getLine(0)).toBe("aaaa bbbbb ");
    expect(a.text.getLine(1)).toBe("ccccc");

    // caret at the start of "ccccc" (offset 11, just after the trailing space)
    a.cursor.setPosition(0, 1);

    keyDown(a, "Backspace");

    // like a normal editor: backspace removes the boundary space before the
    // caret, merging the words — it must NOT be a silent no-op. The merged
    // "bbbbbccccc" is a 10-char unit, so it wraps whole to line 1.
    expect(a.text.value).toBe("aaaa bbbbbccccc");
    expect(a.text.getLine(0)).toBe("aaaa ");
    expect(a.text.getLine(1)).toBe("bbbbbccccc");
    // caret sits at the merge point, between "bbbbb" and "ccccc"
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(5);

    expect(a.text.offsetFromVisual(a.cursor.xLine, a.cursor.yLine)).toBe(
      a.cursor.head
    );
  });

  test("SPACE at wrap boundary: caret follows the split tail down to line 1", () => {
    const a = setup("aaaaaacccc"); // single 10-char token filling line 0
    expect(a.text.getLine(0)).toBe("aaaaaacccc");

    // caret between "aaaaaa" and "cccc"
    a.cursor.setPosition(6, 0);

    keyDown(a, " ");

    expect(a.text.value).toBe("aaaaaa cccc");
    expect(a.text.getLine(1)).toBe("cccc");

    // caret sits just after the inserted space => start of line 1
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });
});
