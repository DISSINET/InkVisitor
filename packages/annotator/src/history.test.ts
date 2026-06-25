/**
 * Undo/redo history (#3086). The History holds full document
 * snapshots ({ value, anchor, head, affinities }) — trivial because the
 * offset model made the caret a pair of raw offsets. Coalescing merges only a
 * contiguous run of single-character typing into one undo step; everything else
 * is a discrete step.
 */
import History, { HistorySnapshot } from "./lib/History";
import { CaretAffinity } from "./lib/Text";

const snap = (value: string, head: number, anchor: number = head): HistorySnapshot => ({
  value,
  head,
  anchor,
  headAffinity: CaretAffinity.DOWNSTREAM,
  anchorAffinity: CaretAffinity.DOWNSTREAM,
});

describe("History", () => {
  test("undo returns the recorded before-state; redo returns the present", () => {
    const h = new History();
    // doc "" -> backspace-like discrete edit producing "a"
    h.record(snap("", 0), false, 1);
    const present = snap("a", 1);
    expect(h.canUndo()).toBe(true);
    const undone = h.undo(present);
    expect(undone).toEqual(snap("", 0));
    expect(h.canRedo()).toBe(true);
    const redone = h.redo(snap("", 0));
    expect(redone).toEqual(present);
  });

  test("a contiguous typing run collapses into a single undo entry", () => {
    const h = new History();
    h.record(snap("", 0), true, 1); // type 'a' (before="")
    h.record(snap("a", 1), true, 2); // type 'b' (before="a", contiguous)
    h.record(snap("ab", 2), true, 3); // type 'c' (before="ab", contiguous)
    const present = snap("abc", 3);
    expect(h.undo(present)).toEqual(snap("", 0)); // single step back to ""
    expect(h.canUndo()).toBe(false);
  });

  test("a non-contiguous insert starts a new entry (caret jump breaks the run)", () => {
    const h = new History();
    h.record(snap("", 0), true, 1); // type 'a'
    // caret jumped: next insert's before.head (5) != lastAfterHead (1)
    h.record(snap("a    ", 5), true, 6);
    const present = snap("a    x", 6);
    expect(h.undo(present)).toEqual(snap("a    ", 5)); // undoes only the 2nd run
    expect(h.canUndo()).toBe(true);
    expect(h.undo(snap("a    ", 5))).toEqual(snap("", 0));
  });

  test("a non-coalesce op after a typing run is its own entry", () => {
    const h = new History();
    h.record(snap("", 0), true, 1); // type 'a'
    h.record(snap("a", 1), false, 0); // backspace (discrete)
    const present = snap("", 0);
    expect(h.undo(present)).toEqual(snap("a", 1)); // undo the delete
    expect(h.undo(snap("a", 1))).toEqual(snap("", 0)); // undo the typing
  });

  test("a new edit after undo clears the redo stack", () => {
    const h = new History();
    h.record(snap("", 0), false, 1);
    h.undo(snap("a", 1));
    expect(h.canRedo()).toBe(true);
    h.record(snap("", 0), false, 1); // fresh edit invalidates redo
    expect(h.canRedo()).toBe(false);
  });

  test("the stack is bounded — oldest entries drop past maxSize", () => {
    const h = new History(2);
    h.record(snap("1", 0), false, 0);
    h.record(snap("2", 0), false, 0);
    h.record(snap("3", 0), false, 0); // drops "1"
    expect(h.undo(snap("p", 0))).toEqual(snap("3", 0));
    expect(h.undo(snap("3", 0))).toEqual(snap("2", 0));
    expect(h.canUndo()).toBe(false); // "1" was dropped
  });

  test("undo/redo on an empty stack are no-ops returning null", () => {
    const h = new History();
    expect(h.canUndo()).toBe(false);
    expect(h.undo(snap("a", 1))).toBeNull();
    expect(h.canRedo()).toBe(false);
    expect(h.redo(snap("a", 1))).toBeNull();
  });

  test("undo resets coalescing so a following typing op does not merge", () => {
    const h = new History();
    h.record(snap("", 0), true, 1); // type 'a' -> "a"
    h.undo(snap("a", 1)); // back to ""
    // redo path not taken; user types again from "" — must be a new entry,
    // not merged onto the (now redo-side) run.
    h.record(snap("", 0), true, 1);
    expect(h.canRedo()).toBe(false); // recording cleared redo
    expect(h.undo(snap("a", 1))).toEqual(snap("", 0));
  });
});
