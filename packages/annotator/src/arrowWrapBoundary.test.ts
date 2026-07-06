import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

function keyDown(a: Annotator, key: string, shiftKey = false) {
  a.keys.onKeyDown({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey,
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

// A soft-wrap boundary is one offset with two visual positions (end of line N,
// start of line N+1). Plain Left from the continuation-line start skips the
// phantom end-of-previous-line stop and lands on the SECOND-TO-LAST position of
// the previous line (Word-style, where the wrap's end and the next line's start
// are one position). shift+Left already skipped that flip so the selection grows
// by a char. Here the previous line ends in a trailing wrap space ("aaaa bbbbb "),
// so its second-to-last position is the column just before that space.
describe("ArrowLeft at a soft-wrap boundary", () => {
  test("plain Left from a continuation line start lands on the second-to-last position of the previous line", () => {
    const a = setup("aaaa bbbbb ccccc");
    expect(a.text.getLine(0)).toBe("aaaa bbbbb "); // trailing wrap space at the end
    expect(a.text.getLine(1)).toBe("ccccc");

    a.cursor.setPosition(0, 1); // leftmost of the continuation line
    keyDown(a, "ArrowLeft");

    // Word-style: the boundary's end == this line's start share one offset, so the
    // first real position back is the second-to-last column of the previous line
    // (just before its trailing space), and it stays within the viewport.
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(a.text.getLine(0).length - 1); // 10 = before the trailing space
    expect(a.cursor.xLine).toBeLessThanOrEqual(MAXLEN);
  });

  test("a second plain Left then steps further into the previous line content", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    keyDown(a, "ArrowLeft"); // (10,0) second-to-last of the previous line
    keyDown(a, "ArrowLeft"); // (9,0) one more char back
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(9);
  });

  test("a normal left move (not at a boundary) still steps exactly one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(3, 0); // inside "aaaa"
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(3);
    keyDown(a, "ArrowLeft");
    expect(a.cursor.head).toBe(2);
  });

  test("shift+Left from a continuation start extends the selection by one char", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 1);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(11); // start of "ccccc"
    keyDown(a, "ArrowLeft", true);
    // shift skips the affinity flip so the selection actually grows by one char
    // (selecting the trailing wrap space)
    expect(a.cursor.head).toBe(10);
    expect(a.cursor.isSelected()).toBe(true);
  });

  test("at document start ArrowLeft stays put", () => {
    const a = setup("aaaa bbbbb ccccc");
    a.cursor.setPosition(0, 0);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    keyDown(a, "ArrowLeft");
    expect(a.cursor.head).toBe(0);
  });
});

// A long word broken across lines wraps mid-word, so the line ends in a VISIBLE
// char. Right still stops at that line end (after the visible char) when arriving
// from before it, but from the line end it advances to the SECOND position of the
// next line — the boundary is one logical position, never a double-stop. This
// mirrors plain Left landing on the previous line's second-to-last position, so
// Left and Right are symmetric across the wrap.
describe("ArrowRight at a soft-wrap boundary ending in a visible char", () => {
  test("plain Right from a wrapped line end advances to the second position of the next line", () => {
    // "supercalifragilistic" breaks mid-word, so line 0 ends in a visible 'f'.
    const a = setup("supercalifragilistic");
    expect(a.text.getLine(0)).toBe("supercalif");
    expect(a.text.getLine(1)).toBe("ragilistic");

    a.cursor.setPosition(MAXLEN, 0); // end of line 0 (after its last char)
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10); // the single boundary offset

    keyDown(a, "ArrowRight");

    // the boundary is one logical position, so Right advances a real char into the
    // next line (its second position) rather than resting again at its start
    expect(a.cursor.head).toBe(11);
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("a second plain Right then steps one more char into the next line", () => {
    const a = setup("supercalifragilistic");
    a.cursor.setPosition(MAXLEN, 0);
    keyDown(a, "ArrowRight"); // (1,1) second position of the next line
    keyDown(a, "ArrowRight"); // (2,1) one more char in
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(2);
  });

  test("a long word walks end-of-line -> second-of-next-line without a double-stop", () => {
    // a single word too long for one line ("supercalif" | "ragilistic"); there is
    // no whitespace in the raw text, yet the boundary is still one logical position.
    const a = setup("supercalifragilistic");
    a.cursor.setPosition(9, 0); // before the last visible char of line 0
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(9);

    keyDown(a, "ArrowRight"); // -> last position of the first line
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 10, y: 0 });

    keyDown(a, "ArrowRight"); // -> SECOND position of the next line, not its start
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 1, y: 1 });

    keyDown(a, "ArrowRight"); // -> one more char in
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 2, y: 1 });
  });

  test("shift+Right from a wrapped line end extends the selection by one char", () => {
    const a = setup("supercalifragilistic");
    a.cursor.setPosition(MAXLEN, 0);
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10);
    keyDown(a, "ArrowRight", true);
    // shift skips the affinity flip so the selection actually grows by one char
    expect(a.cursor.head).toBe(11);
    expect(a.cursor.isSelected()).toBe(true);
  });

  test("a normal right move (not at a boundary) still steps exactly one char", () => {
    const a = setup("supercalifragilistic");
    a.cursor.setPosition(2, 0); // inside "supercalif"
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(2);
    keyDown(a, "ArrowRight");
    expect(a.cursor.head).toBe(3);
  });
});

// From the second-to-last position of a wrapped line whose last char is a
// trailing wrap whitespace, plain Right jumps to the start of the next line
// (skipping the "after the trailing space" end-of-line position). This mirrors the
// plain-Left second-to-last landing, so the two are inverses across such a wrap.
describe("plain Right from second-to-last of a wrapped line ending in whitespace", () => {
  test("Right jumps to the start of the next line, skipping the trailing wrap space", () => {
    const a = setup("aaaa bbbb ccccc");
    expect(a.text.getLine(0)).toBe("aaaa bbbb "); // trailing wrap space at the end
    expect(a.text.getLine(1)).toBe("ccccc");

    a.cursor.setPosition(9, 0); // second-to-last: just before the trailing space
    keyDown(a, "ArrowRight");

    // lands at the start of the next line, not at (10,0) after the invisible space
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });

  test("Right from the wrapped line end (after the trailing space) advances into the next line", () => {
    const a = setup("aaaa bbbb ccccc");
    // from the very end of the wrapped line — past the trailing space — plain
    // Right must step into the next line's content, not merely flip affinity and
    // rest a second time at the same boundary offset.
    a.cursor.setPosition(MAXLEN, 0); // end of line 0 (after the trailing space)
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10); // boundary offset (start of "ccccc")

    keyDown(a, "ArrowRight");

    expect(a.cursor.head).toBe(11); // advanced one real char into "ccccc"
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("mid-word wrap (last char visible) is unaffected: Right stops at the line end first", () => {
    const a = setup("supercalifragilistic"); // ["supercalif","ragilistic"], ends with 'f'
    a.cursor.setPosition(9, 0); // before the last visible char 'f'
    keyDown(a, "ArrowRight");
    // no trailing whitespace, so Right still pauses at the end of the wrapped line
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(10);
  });

  test("Left then Right round-trips across the trailing-space boundary", () => {
    const a = setup("aaaa bbbb ccccc");
    a.cursor.setPosition(0, 1); // start of the next line
    keyDown(a, "ArrowLeft"); // -> (9,0) second-to-last of the previous line
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(9);
    keyDown(a, "ArrowRight"); // -> back to (0,1) start of the next line
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });

  // Shift is intentionally excluded from the whitespace flip: extending a
  // selection steps through the trailing space and keeps the endpoint at the line
  // end, so the space is visibly selected before crossing to the next line.
  // Mirrors "lorem ipsum " / "dolor": from before the trailing space, shift+Right
  // goes selection "b" -> "b " (caret at line end) -> "b c" (caret on next line).
  test("shift+Right steps through the trailing space, keeping the endpoint at the line end", () => {
    const a = setup("aaaa bbbb ccccc"); // line0 "aaaa bbbb " (trailing space), line1 "ccccc"
    a.cursor.setPosition(8, 0); // before the last content char 'b'
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(8);

    keyDown(a, "ArrowRight", true); // selects "b"
    expect(a.cursor.head).toBe(9);
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 9, y: 0 });

    keyDown(a, "ArrowRight", true); // selects "b " — endpoint stays at the line end
    expect(a.cursor.head).toBe(10);
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 10, y: 0 });

    keyDown(a, "ArrowRight", true); // selects "b c" — now crosses to the next line
    expect(a.cursor.head).toBe(11);
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 1, y: 1 });
    expect(a.cursor.isSelected()).toBe(true);
  });

  test("shift+Left selects the trailing space with the caret before it", () => {
    const a = setup("aaaa bbbb ccccc");
    a.cursor.setPosition(0, 1); // start of the next line
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(10);

    keyDown(a, "ArrowLeft", true); // shift+Left

    expect(a.cursor.head).toBe(9);
    expect(a.cursor.yLine).toBe(0);
    expect(a.cursor.xLine).toBe(9);
    expect(a.cursor.isSelected()).toBe(true);
  });
});

// Across a trailing-space wrap, plain Right walks the caret exactly as it would
// through the raw text " eodem ipsum dolor" — the trailing space is one char
// between the words, so neither of its two caret positions is a dead double-stop.
// Raw walk: " eodem<CUR> ipsum" -> " eodem <CUR>ipsum" -> " eodem i<CUR>psum".
describe("plain Right walks a trailing-space wrap like the raw text", () => {
  test("from just before the trailing space, Right lands at the next line start", () => {
    const a = setup(" eodem ipsum dolor");
    expect(a.text.getLine(0)).toBe(" eodem "); // trailing wrap space
    expect(a.text.getLine(1)).toBe("ipsum "); // starts flush with the word

    a.cursor.setPosition(6, 0); // " eodem<CUR> " — before the trailing space
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(6);

    keyDown(a, "ArrowRight");

    // " eodem <CUR>ipsum": next line start, before 'i'
    expect(a.cursor.head).toBe(7);
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(0);
  });

  test("from the line end after the trailing space, Right lands after 'i'", () => {
    const a = setup(" eodem ipsum dolor");

    a.cursor.setPosition(7, 0); // " eodem <CUR>" — end of line 0, past the space
    a.cursor.reconcileOffsetsFromVisual(a.text);
    expect(a.cursor.head).toBe(7);

    keyDown(a, "ArrowRight");

    // " eodem i<CUR>psum": advanced one real char into the next line
    expect(a.cursor.head).toBe(8);
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });

  test("stepping Right from before the space reaches the same place in two presses", () => {
    const a = setup(" eodem ipsum dolor");
    a.cursor.setPosition(6, 0); // before the trailing space
    a.cursor.reconcileOffsetsFromVisual(a.text);

    keyDown(a, "ArrowRight"); // -> next line start (head 7)
    keyDown(a, "ArrowRight"); // -> after 'i' (head 8)

    expect(a.cursor.head).toBe(8);
    expect(a.cursor.yLine).toBe(1);
    expect(a.cursor.xLine).toBe(1);
  });
});

// Plain Backspace routes through onArrowLeft's single-column branch, so the
// second-to-last change must not make it delete two chars across a soft-wrap boundary.
describe("plain Backspace at a soft-wrap boundary (regression)", () => {
  test("Backspace from a continuation line start removes exactly the previous line's last char", () => {
    const a = setup("supercalifragilistic"); // wraps to ["supercalif","ragilistic"]
    expect(a.text.getLine(0)).toBe("supercalif");
    expect(a.text.getLine(1)).toBe("ragilistic");

    a.cursor.setPosition(0, 1); // start of "ragilistic" (offset 10)
    keyDown(a, "Backspace");

    // deletes only 'f' (offset 9); caret lands where that char was
    expect(a.text.value).toBe("supercaliragilistic");
    expect(a.cursor.head).toBe(9);
  });
});
