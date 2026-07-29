import Cursor from "./Cursor";

/**
 * `anchor`/`head` are canonical and `selectStart`/`selectEnd` are derived from
 * them, so anything that clears a selection has to collapse the offsets too —
 * a resize re-derives the visual state and would otherwise bring the selection
 * back after the user dismissed it.
 */
describe("Cursor selection clearing", () => {
  const withSelection = () => {
    const cursor = new Cursor(1);
    cursor.anchor = 4;
    cursor.head = 11;
    cursor.selectStart = { xLine: 4, yLine: 0 };
    cursor.selectEnd = { xLine: 11, yLine: 0 };
    return cursor;
  };

  it("collapses the canonical offsets on reset, not just the visual selection", () => {
    const cursor = withSelection();
    cursor.reset();

    expect(cursor.selectStart).toBeUndefined();
    expect(cursor.selectEnd).toBeUndefined();
    expect(cursor.anchor).toBe(cursor.head);
  });

  it("collapses the canonical offsets on resetHighlight", () => {
    const cursor = withSelection();
    cursor.resetHighlight();

    expect(cursor.selectStart).toBeUndefined();
    expect(cursor.selectEnd).toBeUndefined();
    expect(cursor.anchor).toBe(cursor.head);
  });

  it("keeps the caret offset where it was when only the highlight is cleared", () => {
    const cursor = withSelection();
    cursor.resetHighlight();

    expect(cursor.head).toBe(11);
  });
});
