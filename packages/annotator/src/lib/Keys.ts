import { EditMode } from "./constants";
import Cursor, { DIRECTION } from "./Cursor";
import Text from "./Text";
import Viewport from "./Viewport";

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

  /** Scroll so cursor line is 3rd from top when above viewport, 3rd from bottom when below. */
  scrollCursorIntoView() {
    const absY = this.cursor.yLine;
    const noLines = this.viewport.noLines;
    const maxStart = Math.max(0, this.text.noLines - noLines);

    if (absY < this.viewport.lineStart) {
      // cursor is before viewport -> scroll to the 3rd line of viewport
      this.viewport.scrollTo(Math.max(0, absY - 2), this.text.noLines);
    } else if (absY >= this.viewport.lineEnd) {
      // cursor is after viewport -> scroll to the 3rd line from the end of viewport
      const targetStart = Math.min(maxStart, absY - (noLines - 1 - 2));
      this.viewport.scrollTo(Math.max(0, targetStart), this.text.noLines);
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
      this.viewport.scrollTo(this.text.noLines, this.text.noLines);
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
    }
    // else if (metaKey) {
    //   const end = this.cursor.getAbsolutePosition();
    //   const start = { xLine: 0, yLine: end.yLine };
    //   this.text.deleteRangeText(start, end);
    //   this.cursor.setPosition(0, end.yLine);
    //   if (this.annotator.onTextChangeCb) {
    //     this.annotator.onTextChangeCb(this.text.value);
    //   }
    // }
    else {
      const before = this.cursor.getAbsolutePosition();
      this.onArrowLeft({ ctrlKey, shiftKey, altKey });
      const after = this.cursor.getAbsolutePosition();

      this.text.deleteRangeText(before, after);

      if (this.annotator.onTextChangeCb) {
        this.annotator.onTextChangeCb(this.text.value);
      }
    }
  }

  onKeyDelete({
    ctrlKey,
    shiftKey,
  }: {
    ctrlKey?: boolean;
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
    } else {
      const before = this.cursor.getAbsolutePosition();
      this.onArrowRight({ ctrlKey, shiftKey });
      const after = this.cursor.getAbsolutePosition();

      this.text.deleteRangeText(before, after);
      this.cursor.xLine = before.xLine;
      this.cursor.yLine = before.yLine;

      if (this.annotator.onTextChangeCb) {
        this.annotator.onTextChangeCb(this.text.value);
      }
    }
  }

  onKeyPgUp({ ctrlKey, shiftKey }: { ctrlKey?: boolean; shiftKey?: boolean }) {
    const originalViewport = this.viewport.lineStart;
    this.viewport.scrollUp(this.viewport.noLines);

    if (originalViewport === this.viewport.lineStart) {
      this.cursor.yLine = 0;
      this.cursor.xLine = 0;
    }

    if (shiftKey) {
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

  onKeyPgDown({
    ctrlKey,
    shiftKey,
  }: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
  }) {
    const originalViewport = this.viewport.lineStart;
    this.viewport.scrollDown(this.viewport.noLines, this.text.noLines);

    if (originalViewport === this.viewport.lineStart) {
      this.cursor.yLine = Math.min(
        this.text.noLines - 1,
        this.viewport.lineEnd - 1
      );
    }
    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    if (line.length < this.cursor.xLine) {
      this.cursor.xLine = line.length;
    }

    if (shiftKey) {
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

    if (metaKey && shiftKey) {
      this.cursor.selectStart = { xLine: 0, yLine: 0 };
      this.cursor.selectEnd = {
        xLine: originalXLine,
        yLine: originalAbsYline,
      };
      this.viewport.scrollTo(0, this.text.noLines);
      this.cursor.yLine = 0;
      this.cursor.xLine = 0;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      // Cmd + Up: jump to very start of text (first line, col 0)
      this.viewport.scrollTo(0, this.text.noLines);
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

    // cursor should not go being line bounds (right side)
    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
    if (line.length < this.cursor.xLine) {
      this.cursor.xLine = line.length;
    }

    if (shiftKey) {
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
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

    if (metaKey && shiftKey) {
      const lastLineIndex = this.text.noLines > 0 ? this.text.noLines - 1 : 0;
      const lineText = this.text.getLine(lastLineIndex) ?? "";
      this.cursor.selectStart = {
        xLine: originalXLine,
        yLine: originalAbsYline,
      };
      this.cursor.selectEnd = {
        xLine: lineText.length,
        yLine: lastLineIndex,
      };
      this.viewport.scrollTo(this.text.noLines, this.text.noLines);
      this.cursor.yLine = lastLineIndex;
      this.cursor.xLine = lineText.length;
      this.cursor.setTrueSelectionDirection();
      return;
    } else if (metaKey && !shiftKey) {
      const lastLineIndex = this.text.noLines > 0 ? this.text.noLines - 1 : 0;
      const lineText = this.text.getLine(lastLineIndex) ?? "";
      this.viewport.scrollTo(this.text.noLines, this.text.noLines);
      this.cursor.yLine = lastLineIndex;
      this.cursor.xLine = lineText.length;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    this.cursor.move(0, 1);

    const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";

    if (this.cursor.yLine >= this.text.noLines) {
      this.cursor.yLine = Math.max(0, this.text.noLines - 1);
      this.cursor.xLine = line.length;
    }

    if (line.length < this.cursor.xLine) {
      this.cursor.xLine = line.length;
    }

    if (shiftKey) {
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: originalAbsYline,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
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
      this.cursor.selectStart = { xLine: 0, yLine: absY };
      this.cursor.selectEnd = {
        xLine: this.cursor.xLine,
        yLine: absY,
      };
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
                this.cursor.yLine = coords.yLine;
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
            this.cursor.yLine =
              seg.lineStart + lineChar.lineIndex - this.viewport.lineStart;
          }
        }
      }
    } else if (!ctrlHandled) {
      // Single-character left movement (no ctrl/alt)
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

    if (shiftKey) {
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        // Use absY (captured before movement) so selection start stays on the original line
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: absY,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      }
    } else {
      if (this.cursor.isSelected()) {
        this.cursor.xLine = this.cursor.selectStart?.xLine || this.cursor.xLine;
        this.cursor.yLine = this.cursor.selectStart?.yLine ?? this.cursor.yLine;
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
      this.cursor.selectStart = {
        xLine: this.cursor.xLine,
        yLine: absY,
      };
      this.cursor.selectEnd = { xLine: line.length, yLine: absY };
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
                this.cursor.yLine = coords.yLine;
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
      // Single-character right movement (no ctrl/alt)
      this.cursor.move(offsetRight, 0);

      const line = this.text.getCurrentLine(this.viewport, this.cursor) || "";
      let backupXLine = this.cursor.xLine;
      let backupYLine = this.cursor.yLine;

      if (line.length < this.cursor.xLine) {
        this.cursor.xLine = 0;
        this.cursor.yLine++;
      }

      if (!this.text.cursorToIndex(this.viewport, this.cursor)) {
        this.cursor.xLine = backupXLine - 1;
        this.cursor.yLine = backupYLine;
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
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        // Use absY (captured before movement) so selection start stays on the original line
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: absY,
        };
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      }
    } else {
      if (this.cursor.isSelected()) {
        this.cursor.xLine = this.cursor.selectEnd?.xLine || this.cursor.xLine;
        this.cursor.yLine = this.cursor.selectEnd?.yLine ?? this.cursor.yLine;
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

            const lastSegment =
              this.text.segments[this.text.segments.length - 1];
            this.cursor.selectEnd = {
              xLine: lastSegment.lines[lastSegment.lines.length - 1].length,
              yLine: lastSegment.lineEnd,
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
          if (this.annotator.onTextChangeCb) {
            this.annotator.onTextChangeCb(this.text.value);
          }
          this.cursor.move(+1, 0);

          // When typing moves the cursor outside of the current viewport,
          // keep behaviour consistent with arrow keys and scroll so that
          // the cursor line is visible again.
          this.scrollCursorIntoView();
        }
    }

    if (
      this.text.mode !== EditMode.HIGHLIGHT &&
      this.annotator.onTextChangeCb
    ) {
      this.annotator.onTextChangeCb(this.text.value);
    }
    this.annotator.draw();
  }
}
