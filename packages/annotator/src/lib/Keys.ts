import { EditMode } from "./constants";
import Cursor, { DIRECTION } from "./Cursor";
import Text, { CaretAffinity } from "./Text";
import Viewport from "./Viewport";

/** Snapshot of caret before an arrow-key nudge (absolute line / column). */
type CaretPoint = { xLine: number; yLine: number };

enum Key {
  CapsLock = "CapsLock",
  Shift = "Shift",
  Control = "Control",
  Alt = "Alt",
  Tab = "Tab",
  Escape = "Escape",
  Enter = "Enter",
  Delete = "Delete",
  Insert = "Insert",
  Home = "Home",
  End = "End",
  Meta = "Meta",
  PageUp = "PageUp",
  PageDown = "PageDown",
  Fn = "Fn",
  FnLock = "FnLock",
  NumLock = "NumLock",
  ScrollLock = "ScrollLock",
  Backspace = "Backspace",
  ArrowUp = "ArrowUp",
  ArrowDown = "ArrowDown",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
}

export interface AnnotatorCallbacks {
  onTextChangeCb?: (text: string) => void;
  onCopyText(): void;
  onPasteText(): void;
  draw(): void;
  width: number;
  charWidth: number;
  cursor: Cursor;
  viewport: Viewport;
  text: Text;
  element: HTMLCanvasElement;
  scrollExtentLineCount(): number;
}

export default class Keys {
  annotator: AnnotatorCallbacks;

  cursor: Cursor;
  viewport: Viewport;
  text: Text;

  constructor(annotatorBackfill: AnnotatorCallbacks) {
    this.annotator = annotatorBackfill;
    this.cursor = this.annotator.cursor;
    this.viewport = this.annotator.viewport;
    this.text = this.annotator.text;

    this.annotator.element.onkeydown = this.onKeyDown.bind(this);
  }

  /**
   * After shift+arrow, only the selection endpoint that was at the caret should
   * move. Cmd+Shift+Left leaves the caret at line start while selectDirection is
   * FORWARD (start before end on the same line), so updating selectEnd would drop
   * the line-end anchor — match the pre-move caret to start or end instead.
   */
  private extendShiftSelectionToCaret(prev: CaretPoint): void {
    const s = this.cursor.selectStart;
    const e = this.cursor.selectEnd;
    if (!s || !e) {
      return;
    }

    const next: CaretPoint = {
      xLine: this.cursor.xLine,
      yLine: this.cursor.yLine,
    };

    const atStart = prev.xLine === s.xLine && prev.yLine === s.yLine;
    const atEnd = prev.xLine === e.xLine && prev.yLine === e.yLine;

    if (atStart && !atEnd) {
      this.cursor.selectStart = { ...next };
    } else if (atEnd && !atStart) {
      this.cursor.selectEnd = { ...next };
    } else if (atStart && atEnd) {
      this.cursor.selectStart = { xLine: prev.xLine, yLine: prev.yLine };
      this.cursor.selectEnd = { ...next };
    } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
      this.cursor.selectStart = { ...next };
    } else {
      this.cursor.selectEnd = { ...next };
    }
  }

  private compareDocPoints(a: CaretPoint, b: CaretPoint): number {
    if (a.yLine !== b.yLine) return a.yLine - b.yLine;
    return a.xLine - b.xLine;
  }

  /**
   * Phase 3.2 — one document position to the RIGHT of `(offset, affinity)`,
   * preserving soft-wrap caret affinity. At an UPSTREAM boundary the caret first
   * steps DOWNSTREAM (same offset, start of the next visual line); otherwise it
   * advances one offset, taking UPSTREAM affinity if it lands on a boundary.
   */
  private stepRightOffset(
    offset: number,
    affinity: CaretAffinity
  ): { offset: number; affinity: CaretAffinity } {
    if (
      this.text.isWrapBoundary(offset) &&
      affinity === CaretAffinity.UPSTREAM
    ) {
      return { offset, affinity: CaretAffinity.DOWNSTREAM };
    }
    if (offset >= this.text.value.length) {
      return { offset, affinity };
    }
    const next = offset + 1;
    return {
      offset: next,
      affinity: this.text.isWrapBoundary(next)
        ? CaretAffinity.UPSTREAM
        : CaretAffinity.DOWNSTREAM,
    };
  }

  /**
   * Phase 3.2 — one document position to the LEFT of `(offset, affinity)`. At a
   * DOWNSTREAM boundary the caret first steps UPSTREAM (same offset, end of the
   * previous visual line); otherwise it retreats one offset (DOWNSTREAM).
   */
  private stepLeftOffset(
    offset: number,
    affinity: CaretAffinity
  ): { offset: number; affinity: CaretAffinity } {
    if (
      this.text.isWrapBoundary(offset) &&
      affinity === CaretAffinity.DOWNSTREAM
    ) {
      return { offset, affinity: CaretAffinity.UPSTREAM };
    }
    if (offset <= 0) {
      return { offset, affinity };
    }
    return { offset: offset - 1, affinity: CaretAffinity.DOWNSTREAM };
  }

  private docCaretMin(a: CaretPoint, b: CaretPoint): CaretPoint {
    return this.compareDocPoints(a, b) <= 0 ? { ...a } : { ...b };
  }

  private docCaretMax(a: CaretPoint, b: CaretPoint): CaretPoint {
    return this.compareDocPoints(a, b) >= 0 ? { ...a } : { ...b };
  }

  /** Scroll so cursor line is 3rd from top when above viewport, 3rd from bottom when below. */
  scrollCursorIntoView() {
    const absY = this.cursor.yLine;
    const noLines = this.viewport.noLines;
    const extent = this.annotator.scrollExtentLineCount();
    const maxStart = Math.max(0, extent - 1 - noLines);

    if (absY < this.viewport.lineStart) {
      // cursor is before viewport -> scroll to the 3rd line of viewport
      this.viewport.scrollTo(Math.max(0, absY - 2), extent);
    } else if (absY >= this.viewport.lineEnd) {
      // cursor is after viewport -> scroll to the 3rd line from the end of viewport
      const targetStart = Math.min(maxStart, absY - (noLines - 1 - 2));
      this.viewport.scrollTo(Math.max(0, targetStart), extent);
    }
  }

  onKeyHome({ ctrlKey, shiftKey }: { ctrlKey?: boolean; shiftKey?: boolean }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYLine = this.cursor.yLine;

    this.cursor.xLine = 0;

    if (ctrlKey) {
      this.cursor.yLine = 0;
      this.viewport.lineStart = 0;
    }

    if (shiftKey) {
      if (this.cursor.selectDirection === undefined) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYLine,
        };
      }
      this.cursor.selectEnd = {
        xLine: 0,
        yLine: this.cursor.yLine,
      };
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.cursor.setTrueSelectionDirection();
  }

  onKeyEnd({ ctrlKey, shiftKey }: { ctrlKey?: boolean; shiftKey?: boolean }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYLine = this.cursor.yLine;

    if (ctrlKey) {
      const lastLine = this.text.noLines > 0 ? this.text.noLines - 1 : 0;
      this.cursor.yLine = lastLine;
      const extent = this.annotator.scrollExtentLineCount();
      this.viewport.scrollTo(extent, extent);
    }

    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    this.cursor.xLine = line.length;

    if (shiftKey) {
      if (this.cursor.selectDirection === undefined) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYLine,
        };
      }
      this.cursor.selectEnd = {
        xLine: this.cursor.xLine,
        yLine: this.cursor.yLine,
      };
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.cursor.setTrueSelectionDirection();
  }

  onKeyBackspace({
    ctrlKey,
    altKey,
    metaKey,
    shiftKey,
  }: {
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  }) {
    if (this.text.mode === EditMode.HIGHLIGHT) {
      return;
    }

    const area = this.cursor.getSelectedArea();
    if (area) {
      this.text.deleteRangeText(area[0], area[1]);
      this.cursor.reset();
      this.cursor.setPosition(area[0].xLine, area[0].yLine);
    } else if (metaKey && !altKey && !ctrlKey) {
      // Cmd+Backspace: delete from beginning of line to caret (macOS-style).
      const end = this.cursor.getAbsolutePosition();
      const start = { xLine: 0, yLine: end.yLine };
      this.text.deleteRangeText(start, end);
      this.cursor.setPosition(0, end.yLine);
    } else {
      // Delete word-wise: Ctrl / Alt / ⌥+⌘ + ←  or Ctrl+Alt + ← on Windows
      const before = this.cursor.getAbsolutePosition();
      this.onArrowLeft({
        ctrlKey: ctrlKey || altKey,
        shiftKey,
        altKey: false,
        metaKey: false,
      });
      const after = this.cursor.getAbsolutePosition();

      this.text.deleteRangeText(before, after);
    }
  }

  onKeyDelete({
    ctrlKey,
    altKey,
    metaKey,
    shiftKey,
  }: {
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  }) {
    if (this.text.mode === EditMode.HIGHLIGHT) {
      return;
    }

    const area = this.cursor.getSelectedArea();
    if (area) {
      this.text.deleteRangeText(area[0], area[1]);
      this.cursor.reset();
      this.cursor.setPosition(area[0].xLine, area[0].yLine);
    } else if (metaKey && !altKey && !ctrlKey) {
      const before = this.cursor.getAbsolutePosition();
      const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
      const end = { xLine: line.length, yLine: before.yLine };
      this.text.deleteRangeText(before, end);
      this.cursor.setPosition(before.xLine, before.yLine);
    } else {
      const before = this.cursor.getAbsolutePosition();
      this.onArrowRight({
        ctrlKey: ctrlKey || altKey,
        shiftKey,
        altKey: false,
        metaKey: false,
      });
      const after = this.cursor.getAbsolutePosition();

      this.text.deleteRangeText(before, after);
      this.cursor.xLine = before.xLine;
      this.cursor.yLine = before.yLine;
    }
  }

  onKeyPgUp({ shiftKey }: { ctrlKey?: boolean; shiftKey?: boolean }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYLine = this.cursor.yLine;
    const pageStep = this.viewport.noLines;

    this.cursor.yLine = Math.max(0, this.cursor.yLine - pageStep);
    if (this.cursor.yLine === 0) {
      this.cursor.xLine = 0;
    }

    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    if (line.length < this.cursor.xLine) {
      this.cursor.xLine = line.length;
    }

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYLine,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: originalAbsYLine,
        });
      }
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  onKeyPgDown({
    shiftKey,
  }: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
  }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYLine = this.cursor.yLine;
    const pageStep = this.viewport.noLines;
    const maxLine = Math.max(0, this.text.noLines - 1);

    this.cursor.yLine = Math.min(maxLine, this.cursor.yLine + pageStep);

    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    if (line.length < this.cursor.xLine) {
      this.cursor.xLine = line.length;
    }

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYLine,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: originalAbsYLine,
        });
      }
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  onKeyEnter() {
    if (this.text.mode === EditMode.HIGHLIGHT) {
      return;
    }
    const area = this.cursor.getSelectedArea();
    if (area) {
      this.text.deleteRangeText(area[0], area[1]);
      this.cursor.reset();
      this.cursor.setPosition(area[0].xLine, area[0].yLine);
    }
    this.text.insertNewline(this.viewport, this.cursor);

    this.cursor.moveToNewline();
    this.scrollCursorIntoView();
  }

  onArrowUp({
    ctrlKey,
    shiftKey,
    metaKey,
  }: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYline = this.cursor.yLine;

    if (metaKey) {
      // Cmd+Up/Down jump to document bounds — not a column-preserving move.
      this.cursor.goalColumn = null;
    }

    if (metaKey && shiftKey) {
      const [hStart, hEnd] = this.cursor.getAbsBounds();
      const hasRange =
        hStart &&
        hEnd &&
        (hStart.xLine !== hEnd.xLine || hStart.yLine !== hEnd.yLine);

      // Extend to document start while keeping the far end of the current
      // range (not the caret alone — after Cmd+Shift+Right the caret is at EOL
      // but the passive anchor must stay at the line-start column).
      this.cursor.selectStart = { xLine: 0, yLine: 0 };
      if (hasRange && hEnd) {
        this.cursor.selectEnd = {
          xLine: hEnd.xLine,
          yLine: hEnd.yLine,
        };
      } else {
        this.cursor.selectEnd = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
      }
      this.viewport.scrollTo(0, this.annotator.scrollExtentLineCount());
      this.cursor.yLine = 0;
      this.cursor.xLine = 0;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      // Cmd + Up: jump to very start of text (first line, col 0)
      this.viewport.scrollTo(0, this.annotator.scrollExtentLineCount());
      this.cursor.yLine = 0;
      this.cursor.xLine = 0;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    if (this.cursor.yLine <= 0) {
      this.cursor.yLine = 0;
    } else {
      this.cursor.move(0, -1);
      if (this.cursor.yLine === 0) {
        this.cursor.xLine = 0;
      }
    }

    // Preserve the desired column across vertical moves (goal column): clamp to
    // this line for the move, but remember the original column to restore later.
    if (this.cursor.goalColumn === null) {
      this.cursor.goalColumn = originalXLine;
    }
    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    this.cursor.xLine = Math.min(this.cursor.goalColumn, line.length);

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: originalAbsYline,
        });
      }
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  onArrowDown({
    ctrlKey,
    shiftKey,
    metaKey,
  }: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }) {
    const originalXLine = this.cursor.xLine;
    const originalAbsYline = this.cursor.yLine;

    if (metaKey) {
      // Cmd+Up/Down jump to document bounds — not a column-preserving move.
      this.cursor.goalColumn = null;
    }

    if (metaKey && shiftKey) {
      const lastLineIndex = this.text.noLines > 0 ? this.text.noLines - 1 : 0;
      const lineText = this.text.getLine(lastLineIndex) ?? "";
      const [hStart, hEnd] = this.cursor.getAbsBounds();
      const hasRange =
        hStart &&
        hEnd &&
        (hStart.xLine !== hEnd.xLine || hStart.yLine !== hEnd.yLine);

      // Extend to EOF while keeping the document-ordered start of the range
      // (caret may be at EOL after Cmd+Shift+Right; anchor stays at oldX).
      if (hasRange && hStart) {
        this.cursor.selectStart = {
          xLine: hStart.xLine,
          yLine: hStart.yLine,
        };
      } else {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
      }
      this.cursor.selectEnd = {
        xLine: lineText.length,
        yLine: lastLineIndex,
      };
      this.viewport.scrollTo(
        this.annotator.scrollExtentLineCount(),
        this.annotator.scrollExtentLineCount()
      );
      this.cursor.yLine = lastLineIndex;
      this.cursor.xLine = lineText.length;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      const lastLineIndex = this.text.noLines > 0 ? this.text.noLines - 1 : 0;
      const lineText = this.text.getLine(lastLineIndex) ?? "";
      this.viewport.scrollTo(
        this.annotator.scrollExtentLineCount(),
        this.annotator.scrollExtentLineCount()
      );
      this.cursor.yLine = lastLineIndex;
      this.cursor.xLine = lineText.length;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    // Preserve the desired column across vertical moves (goal column).
    if (this.cursor.goalColumn === null) {
      this.cursor.goalColumn = originalXLine;
    }

    this.cursor.move(0, 1);

    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";

    if (this.cursor.yLine >= this.text.noLines) {
      // Past the last line: stay on the last line, at its end.
      this.cursor.yLine = Math.max(0, this.text.noLines - 1);
      this.cursor.xLine = line.length;
    } else {
      this.cursor.xLine = Math.min(this.cursor.goalColumn, line.length);
    }

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: originalAbsYline,
        });
      }
    } else {
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  /**
   * Ctrl/Alt + Left: jump by word/tag. Line boundaries act as delimiters —
   * when the cursor reaches position 0 it stops at the end of the previous line
   * rather than continuing to scan for words across lines.
   * In RAW mode the offset is applied directly to the line position;
   * if it would cross a line boundary the absolute index is used instead.
   */
  onArrowLeft({
    ctrlKey,
    altKey,
    shiftKey,
    metaKey,
  }: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }) {
    const absY = this.cursor.yLine;
    if (metaKey && shiftKey) {
      const [hStart, hEnd] = this.cursor.getAbsBounds();
      const hasRange =
        hStart &&
        hEnd &&
        (hStart.xLine !== hEnd.xLine || hStart.yLine !== hEnd.yLine);

      const curX = this.cursor.xLine;
      // Line segment: BOL of current row → caret (before move). Union with any
      // existing range so multi-line selections are not replaced / “reversed”.
      if (hasRange && hStart && hEnd) {
        const segLo: CaretPoint = { xLine: 0, yLine: absY };
        const segHi: CaretPoint = { xLine: curX, yLine: absY };
        const u0 = this.docCaretMin(hStart, segLo);
        const u1 = this.docCaretMax(hEnd, segHi);
        this.cursor.selectStart = { ...u0 };
        this.cursor.selectEnd = { ...u1 };
      } else {
        this.cursor.selectStart = { xLine: 0, yLine: absY };
        this.cursor.selectEnd = { xLine: curX, yLine: absY };
      }
      this.cursor.xLine = 0;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      this.cursor.xLine = 0;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    let offsetLeft = -1;

    ctrlKey = ctrlKey || altKey;
    const originalXLine = this.cursor.xLine;

    // Word-jump: scan left for the nearest word/tag boundary.
    // Stops at line boundaries so each press crosses at most one line.
    let ctrlHandled = false;
    if (ctrlKey) {
      offsetLeft = 0;
      const startYLine = this.cursor.yLine;
      while (!offsetLeft) {
        [offsetLeft] = this.text.getCursorWordOffsets(
          this.viewport,
          this.cursor
        );

        if (offsetLeft === -0) {
          // Reached start of line — jump to end of previous line and stop
          if (this.cursor.xLine <= 0) {
            if (this.cursor.yLine > 0) {
              this.cursor.yLine = this.cursor.yLine - 1;
              const prevLine = this.text.getCurrentLine(
                this.viewport,
                this.cursor
              );
              this.cursor.xLine = prevLine?.length || 0;
            }
            ctrlHandled = true;
            break;
          }
          this.cursor.move(-1, 0);
          // Line wrapped during move — treat as line boundary
          if (this.cursor.yLine !== startYLine) {
            ctrlHandled = true;
            break;
          }
        }
      }
    }

    // Apply the word offset to move the cursor
    if (ctrlKey && offsetLeft !== 0) {
      const pos = this.text.cursorToIndex(this.viewport, this.cursor);
      if (pos) {
        if (this.text.mode === EditMode.RAW) {
          // offsetRight is relative to current cursor.xLine (may differ from
          // originalXLine if the while-loop advanced past whitespace)
          const desiredX = this.cursor.xLine + offsetLeft;
          if (desiredX >= 0) {
            this.cursor.xLine = desiredX;
          } else {
            // Crosses line boundary — resolve via absolute text index
            const abs = this.text.getAbsTextIndexFromPosition(pos) + offsetLeft;
            const target = this.text.getSegmentFromAbsTextIndex(abs);
            if (target) {
              const coords = this.text.positionToCursor(this.viewport, target);
              if (coords) {
                this.cursor.xLine = coords.xLine;
                this.cursor.yLine = this.viewport.lineStart + coords.yLine;
              }
            }
          }
        } else {
          const seg = this.text.segments[pos.segmentIndex];
          const targetParsed = Math.max(
            0,
            Math.min(pos.parsedTextIndex + offsetLeft, seg?.parsed?.length ?? 0)
          );
          const lineChar = this.text.getLineAndCharFromSegmentParsedIndex(
            pos.segmentIndex,
            targetParsed
          );
          if (seg && lineChar) {
            this.cursor.xLine = lineChar.charInLineIndex;
            this.cursor.yLine = seg.lineStart + lineChar.lineIndex;
          }
        }
      }
    } else if (!ctrlHandled) {
      if (this.text.mode === EditMode.RAW) {
        // RAW single-character left via the document-offset model (Phase 3.2).
        const { offset, affinity } = this.text.offsetWithAffinityFromVisual(
          originalXLine,
          absY
        );
        if (offset >= 0) {
          const prev = this.stepLeftOffset(offset, affinity);
          const v = this.text.visualFromOffset(prev.offset, prev.affinity);
          if (v) {
            this.cursor.xLine = v.xLine;
            this.cursor.yLine = v.yLine;
            this.cursor.head = prev.offset;
            this.cursor.headAffinity = prev.affinity;
          }
        }
      } else {
        // non-RAW: move by visual (parsed) column (skips hidden tag markup).
        if (this.cursor.xLine <= 0) {
          if (this.cursor.yLine > 0) {
            this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
            const line = this.text.getCurrentLine(this.viewport, this.cursor);
            this.cursor.xLine = line?.length || 0;
          }
        } else {
          this.cursor.move(offsetLeft, 0);
        }
      }
    }

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: absY,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: absY,
        });
      }
    } else {
      if (this.cursor.isSelected()) {
        const [docStart] = this.cursor.getAbsBounds();
        if (docStart) {
          this.cursor.xLine = docStart.xLine;
          this.cursor.yLine = docStart.yLine;
        }
        offsetLeft = 0;
      }

      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  /**
   * Ctrl/Alt + Right: jump by word/tag. Line boundaries act as delimiters —
   * when the cursor reaches end-of-line it stops at position 0 of the next line
   * rather than continuing to scan for words across lines.
   * In RAW mode the offset is applied directly to the line position;
   * if it would cross a line boundary the absolute index is used instead.
   */
  onArrowRight({
    ctrlKey,
    altKey,
    shiftKey,
    metaKey,
  }: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }) {
    const absY = this.cursor.yLine;
    const line = this.text.getLine(absY) ?? "";
    if (metaKey && shiftKey) {
      const [hStart, hEnd] = this.cursor.getAbsBounds();
      const hasRange =
        hStart &&
        hEnd &&
        (hStart.xLine !== hEnd.xLine || hStart.yLine !== hEnd.yLine);

      const curX = this.cursor.xLine;
      const lineLen = line.length;
      if (hasRange && hStart && hEnd) {
        const segLo: CaretPoint = { xLine: curX, yLine: absY };
        const segHi: CaretPoint = { xLine: lineLen, yLine: absY };
        const u0 = this.docCaretMin(hStart, segLo);
        const u1 = this.docCaretMax(hEnd, segHi);
        this.cursor.selectStart = { ...u0 };
        this.cursor.selectEnd = { ...u1 };
      } else {
        this.cursor.selectStart = { xLine: curX, yLine: absY };
        this.cursor.selectEnd = { xLine: lineLen, yLine: absY };
      }
      this.cursor.xLine = line.length;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      this.cursor.xLine = line.length;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    let offsetRight = 1;

    ctrlKey = ctrlKey || altKey;
    const originalXLine = this.cursor.xLine;

    // Word-jump: scan right for the nearest word/tag boundary.
    // Stops at line boundaries so each press crosses at most one line.
    let ctrlRightHandled = false;
    if (ctrlKey) {
      offsetRight = 0;
      const startYLine = this.cursor.yLine;
      while (!offsetRight) {
        [, offsetRight] = this.text.getCursorWordOffsets(
          this.viewport,
          this.cursor
        );
        if (!offsetRight) {
          const lineText =
            this.text.getCurrentLine(this.viewport, this.cursor) || "";
          if (this.cursor.xLine >= lineText.length) {
            // At end of last line — nothing more to the right, bail out
            if (this.cursor.yLine >= this.text.noLines - 1) {
              ctrlRightHandled = true;
              break;
            }
            // Reached end of line — jump to start of next line and stop
            this.cursor.xLine = 0;
            this.cursor.yLine++;
            if (this.cursor.yLine >= this.text.noLines) {
              this.cursor.yLine = this.text.noLines - 1;
            }
            ctrlRightHandled = true;
            break;
          }
          this.cursor.move(1, 0);
          // Line wrapped during move — treat as line boundary
          if (this.cursor.yLine !== startYLine) {
            ctrlRightHandled = true;
            break;
          }
        }

        if (this.cursor.yLine >= this.text.noLines) {
          this.cursor.yLine = Math.max(0, this.text.noLines - 1);
          break;
        }
      }
    }

    // Apply the word offset to move the cursor
    if (ctrlKey && offsetRight !== 0) {
      const pos = this.text.cursorToIndex(this.viewport, this.cursor);
      if (pos) {
        if (this.text.mode === EditMode.RAW) {
          const lineText =
            this.text.getCurrentLine(this.viewport, this.cursor) || "";
          // offsetRight is relative to current cursor.xLine (may differ from
          // originalXLine if the while-loop advanced past whitespace)
          const desiredX = this.cursor.xLine + offsetRight;
          if (desiredX <= lineText.length) {
            this.cursor.xLine = desiredX;
          } else {
            // Crosses line boundary — resolve via absolute text index
            const abs =
              this.text.getAbsTextIndexFromPosition(pos) + offsetRight;
            const target = this.text.getSegmentFromAbsTextIndex(abs);
            if (target) {
              const coords = this.text.positionToCursor(this.viewport, target);
              if (coords) {
                this.cursor.xLine = coords.xLine;
                this.cursor.yLine = this.viewport.lineStart + coords.yLine;
              }
            }
          }
        } else {
          const seg = this.text.segments[pos.segmentIndex];
          const targetParsed = Math.max(
            0,
            Math.min(
              pos.parsedTextIndex + offsetRight,
              seg?.parsed?.length ?? 0
            )
          );
          const lineChar = this.text.getLineAndCharFromSegmentParsedIndex(
            pos.segmentIndex,
            targetParsed
          );
          if (seg && lineChar) {
            this.cursor.xLine = lineChar.charInLineIndex;
            this.cursor.yLine = seg.lineStart + lineChar.lineIndex;
          }
        }
      }
    } else if (!ctrlKey && !ctrlRightHandled) {
      if (this.text.mode === EditMode.RAW) {
        // RAW single-character right via the document-offset model (Phase 3.2):
        // advancing one offset naturally handles EOL->next-line, the soft-wrap
        // affinity boundary, and the EOF clamp — replacing the old
        // move/wrap/backtrack/clamp dance.
        const { offset, affinity } = this.text.offsetWithAffinityFromVisual(
          originalXLine,
          absY
        );
        if (offset >= 0) {
          const next = this.stepRightOffset(offset, affinity);
          const v = this.text.visualFromOffset(next.offset, next.affinity);
          if (v) {
            this.cursor.xLine = v.xLine;
            this.cursor.yLine = v.yLine;
            this.cursor.head = next.offset;
            this.cursor.headAffinity = next.affinity;
          }
        }
      } else {
        // non-RAW: move by visual (parsed) column so the caret skips hidden tag
        // markup instead of stepping into it.
        this.cursor.move(offsetRight, 0);

        const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
        let backupXLine = this.cursor.xLine;
        let backupYLine = this.cursor.yLine;

        if (line.length < this.cursor.xLine) {
          if (this.cursor.yLine >= this.text.noLines - 1) {
            // Already on the last visual line: clamp to EOL, never wrap past EOF.
            this.cursor.xLine = line.length;
          } else {
            this.cursor.xLine = 0;
            this.cursor.yLine++;
          }
        }

        if (!this.text.cursorToIndex(this.viewport, this.cursor)) {
          this.cursor.xLine = backupXLine - 1;
          this.cursor.yLine = backupYLine;
        }
      }
    }

    // Clamp cursor to document bounds.
    // `cursor.yLine` and `cursor.xLine` should never exceed what the text
    // actually contains; otherwise, selection/highlighting can drift by 1.
    const maxAbsY = Math.max(0, this.text.noLines - 1);
    this.cursor.yLine = Math.max(0, Math.min(this.cursor.yLine, maxAbsY));
    const currentLine = this.text.getLine(this.cursor.yLine) ?? "";
    this.cursor.xLine = Math.max(
      0,
      Math.min(this.cursor.xLine, currentLine.length)
    );

    if (shiftKey) {
      if (!this.cursor.selectStart || !this.cursor.selectEnd) {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: absY,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.extendShiftSelectionToCaret({
          xLine: originalXLine,
          yLine: absY,
        });
      }
    } else {
      if (this.cursor.isSelected()) {
        const [, docEnd] = this.cursor.getAbsBounds();
        if (docEnd) {
          this.cursor.xLine = docEnd.xLine;
          this.cursor.yLine = docEnd.yLine;
        }
        offsetRight = 0;
      }

      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
    }

    this.scrollCursorIntoView();
    this.cursor.setTrueSelectionDirection();
  }

  onKeyDown(e: KeyboardEvent) {
    // Allow browser-level refresh shortcuts to work normally, even when the
    // annotator canvas is focused. This keeps standard behaviour for:
    // - F5
    // - Cmd+R / Ctrl+R (including with Shift, e.g. hard reload)
    // - Cmd+Shift+F (hide browser header)
    if (
      // refresh windows
      e.key === "F5" ||
      // refresh mac
      (e.key === "r" && (e.metaKey || e.ctrlKey)) ||
      // access dev tools mac
      // Use `code` instead of `key` because `key` can vary by layout/case.
      (e.code === "KeyI" && e.metaKey && e.altKey) ||
      (e.code === "KeyF" && e.shiftKey && e.metaKey && !e.altKey) ||
      // zoom in / out / reset — Cmd on macOS, Ctrl on Windows/Linux (browser default)
      ((e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        (e.code === "Equal" ||
          e.code === "Minus" ||
          e.code === "NumpadAdd" ||
          e.code === "NumpadSubtract" ||
          e.code === "Digit0"))
    ) {
      return;
    }

    e.preventDefault();
    let key: Key = e.key as Key;
    // Snapshot to fire onTextChangeCb only when the document actually changes.
    const valueBefore = this.text.value;

    // Any key other than vertical movement drops the goal column; ArrowUp/Down
    // manage it themselves so the desired column survives short lines.
    if (e.key !== Key.ArrowUp && e.key !== Key.ArrowDown) {
      this.cursor.goalColumn = null;
    }

    switch (e.key) {
      case Key.Enter:
        this.onKeyEnter();
        break;

      case Key.ArrowUp:
        this.onArrowUp(e);
        break;

      case Key.ArrowDown:
        this.onArrowDown(e);
        break;

      case Key.ArrowLeft:
        this.onArrowLeft(e);
        break;

      case Key.ArrowRight:
        this.onArrowRight(e);
        break;

      case Key.Backspace:
        this.onKeyBackspace(e);
        break;

      case Key.Delete:
        this.onKeyDelete(e);
        break;

      case Key.PageUp:
        this.onKeyPgUp(e);
        break;

      case Key.PageDown:
        this.onKeyPgDown(e);
        break;

      case Key.End:
        this.onKeyEnd(e);
        break;

      case Key.Home:
        this.onKeyHome(e);
        break;

      case Key.Tab:
        if (this.text.mode !== EditMode.HIGHLIGHT) {
          const sel = this.cursor.getSelectedArea();
          if (sel) {
            this.text.deleteRangeText(sel[0], sel[1]);
            this.cursor.reset();
            this.cursor.setPosition(sel[0].xLine, sel[0].yLine);
          }
          this.text.insertText(this.viewport, this.cursor, "\t");
          this.cursor.move(+1, 0);
          this.cursor.fixOutOfBounds(this.viewport, this.text);
          this.scrollCursorIntoView();
        }
        break;

      default:
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "c") {
            this.annotator.onCopyText();
          } else if (e.key === "v") {
            this.annotator.onPasteText();
          } else if (e.key === "x") {
            if (this.text.mode === EditMode.RAW) {
              this.annotator.onCopyText();
              const area = this.cursor.getSelectedArea();
              if (area) {
                this.text.deleteRangeText(area[0], area[1]);
                this.cursor.reset();
                this.cursor.setPosition(area[0].xLine, area[0].yLine);
              }
            } else if (this.text.mode === EditMode.SEMI) {
              this.annotator.onCopyText();
              this.onKeyDelete(e);
            }
          } else if (e.key === "a") {
            this.cursor.selectStart = {
              yLine: 0,
              xLine: 0,
            };

            const lastLine = Math.max(0, this.text.noLines - 1);
            this.cursor.selectEnd = {
              xLine: (this.text.getLine(lastLine) ?? "").length,
              yLine: lastLine,
            };
          }
          break;
        }

        if (key.length === 1) {
          if (this.text.mode === EditMode.HIGHLIGHT) {
            return;
          }

          const area = this.cursor.getSelectedArea();
          if (area) {
            this.text.deleteRangeText(area[0], area[1]);
            this.cursor.reset();
            this.cursor.setPosition(area[0].xLine, area[0].yLine);
          }

          this.text.insertText(this.viewport, this.cursor, key);
          this.cursor.move(+1, 0);
          this.cursor.fixOutOfBounds(this.viewport, this.text);

          // When typing moves the cursor outside of the current viewport,
          // keep behaviour consistent with arrow keys and scroll so that
          // the cursor line is visible again.
          this.scrollCursorIntoView();
        }
    }

    if (
      this.text.mode !== EditMode.HIGHLIGHT &&
      this.annotator.onTextChangeCb &&
      this.text.value !== valueBefore
    ) {
      this.annotator.onTextChangeCb(this.text.value);
    }
    this.annotator.draw();
  }
}
