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
    } else if (metaKey) {
      const end = this.cursor.getAbsolutePosition();
      const start = { xLine: 0, yLine: end.yLine };
      this.text.deleteRangeText(start, end);
      this.cursor.setPosition(0, end.yLine);
      if (this.annotator.onTextChangeCb) {
        this.annotator.onTextChangeCb(this.text.value);
      }
    } else {
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

    // default delta to the left
    let offsetLeft = -1;

    ctrlKey = ctrlKey || altKey;
    const originalXLine = this.cursor.xLine;

    if (ctrlKey) {
      console.log("ctrlKey", ctrlKey);
      // ctrl key used - find last word to the left
      offsetLeft = 0;
      while (!offsetLeft) {
        [offsetLeft] = this.text.getCursorWordOffsets(
          this.viewport,
          this.cursor
        );

        if (offsetLeft === -0) {
          this.cursor.move(-1, 0);
          if (this.cursor.xLine <= 0) {
            this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
            this.cursor.xLine =
              Math.floor(this.annotator.width / this.annotator.charWidth) - 1;
          }
        }
        console.log("offsetLeft", offsetLeft);
      }
    }

    // go 1 line up if at the start
    if (this.cursor.xLine <= 0) {
      // only if there is a way to go up
      if (this.cursor.yLine > 0) {
        this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
        const line = this.text.getCurrentLine(this.viewport, this.cursor);
        this.cursor.xLine = line?.length || 0;
      }
    } else {
      this.cursor.move(offsetLeft, 0);
    }

    if (shiftKey) {
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        // copy cursor's current position as selectEnd - going forward & using left arrow key => reduce area
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        // copy cursor's current position as selectEnd - going backward & using left arrow key => increase area
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        // select area not used yet - using left arrow:
        // - start = original cursor position
        // - end = current cursor position
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: this.cursor.yLine,
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
      // Cmd + Right: move caret to end of line, clear selection
      this.cursor.xLine = line.length;
      this.cursor.selectStart = undefined;
      this.cursor.selectEnd = undefined;
      this.cursor.setTrueSelectionDirection();
      return;
    }

    // default delta to the right
    let offsetRight = 1;

    ctrlKey = ctrlKey || altKey;
    const originalXLine = this.cursor.xLine;

    if (ctrlKey) {
      offsetRight = 0;
      while (!offsetRight) {
        [, offsetRight] = this.text.getCursorWordOffsets(
          this.viewport,
          this.cursor
        );
        if (!offsetRight) {
          this.cursor.move(1, 0);
          if (
            this.cursor.xLine >
            Math.floor(this.annotator.width / this.annotator.charWidth)
          ) {
            this.cursor.xLine = 0;
            this.cursor.yLine++;
          }
        }

        if (this.cursor.yLine >= this.text.noLines) {
          this.cursor.yLine = Math.max(0, this.text.noLines - 1);
          break;
        }
      }
    }

    if (ctrlKey && offsetRight !== 0) {
      const pos = this.text.cursorToIndex(this.viewport, this.cursor);
      if (pos) {
        if (this.text.mode === EditMode.RAW) {
          const abs = this.text.getAbsTextIndexFromPosition(pos) + offsetRight;
          const target = this.text.getSegmentFromAbsTextIndex(abs);
          if (target) {
            const coords = this.text.positionToCursor(this.viewport, target);
            if (coords) {
              this.cursor.xLine = coords.xLine;
              this.cursor.yLine = this.viewport.lineStart + coords.yLine;
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
    } else if (!ctrlKey) {
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

    if (shiftKey) {
      if (this.cursor.selectDirection === DIRECTION.FORWARD) {
        // copy cursor's current position as selectEnd - going forward & using right arrow key => increase area
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else if (this.cursor.selectDirection === DIRECTION.BACKWARD) {
        // copy cursor's current position as selectEnd - going backward & using right arrow key => reduce area
        this.cursor.selectEnd = {
          xLine: this.cursor.xLine,
          yLine: this.cursor.yLine,
        };
      } else {
        // select area not used yet - using right arrow:
        // - start = original cursor position
        // - end = current cursor position
        this.cursor.selectStart = {
          xLine: originalXLine,
          yLine: this.cursor.yLine,
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
  /**
   * onKeyDown is handler for pressed key event
   * @param e
   */
  onKeyDown(e: KeyboardEvent) {
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
              // ctrl + x in semi mode - copy text and delete it
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
