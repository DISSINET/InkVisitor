import { CaretAffinity } from "./Text";

/**
 * A full editor state: the raw document string plus the canonical caret/selection
 * offsets (Phase 3 offset model). Restoring one is just assigning the string and
 * the four offset fields — no fragile visual coordinates are stored.
 */
export interface HistorySnapshot {
  value: string;
  anchor: number;
  head: number;
  anchorAffinity: CaretAffinity;
  headAffinity: CaretAffinity;
}

/**
 * Phase 4 (#3086) — bounded undo/redo stack.
 *
 * Each `record` is given the state as it was *before* a mutation. Undo pushes the
 * live ("present") state onto the redo stack and pops the previous before-state;
 * redo is the mirror. A contiguous run of single-character typing collapses into
 * one entry (see {@link record}); every other op is discrete.
 */
export default class History {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private readonly maxSize: number;

  /** Whether the last recorded op may merge with a following typing op. */
  private lastCoalescable = false;
  /** Caret offset immediately after the last recorded op (contiguity check). */
  private lastAfterHead = -1;

  constructor(maxSize: number = 500) {
    this.maxSize = Math.max(1, maxSize);
  }

  /**
   * Record the pre-mutation state.
   *
   * @param before    state captured before the mutation was applied
   * @param coalesce   true only for a single-character typing insert
   * @param afterHead  caret offset after the mutation (for contiguity tracking)
   *
   * Merges into the current top entry (records nothing) iff the previous op was
   * also coalescable and this op begins exactly where that one ended
   * (`before.head === lastAfterHead`). Otherwise pushes `before` as a new undo
   * entry, trims to `maxSize`, and clears the redo stack.
   */
  record(before: HistorySnapshot, coalesce: boolean, afterHead: number): void {
    const merge =
      coalesce && this.lastCoalescable && before.head === this.lastAfterHead;

    if (!merge) {
      this.undoStack.push({ ...before });
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    }

    this.lastCoalescable = coalesce;
    this.lastAfterHead = afterHead;
  }

  /**
   * Undo: stash the live state on the redo stack and return the previous
   * before-state to restore, or null when there is nothing to undo.
   */
  undo(present: HistorySnapshot): HistorySnapshot | null {
    const target = this.undoStack.pop();
    if (target === undefined) {
      return null;
    }
    this.redoStack.push({ ...present });
    this.endCoalescing();
    return target;
  }

  /** Redo: mirror of {@link undo}. */
  redo(present: HistorySnapshot): HistorySnapshot | null {
    const target = this.redoStack.pop();
    if (target === undefined) {
      return null;
    }
    this.undoStack.push({ ...present });
    this.endCoalescing();
    return target;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Break any in-progress typing run so the next typing op starts a new entry. */
  endCoalescing(): void {
    this.lastCoalescable = false;
    this.lastAfterHead = -1;
  }

  /** Drop all history (e.g. when the document is reloaded from scratch). */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.endCoalescing();
  }
}
