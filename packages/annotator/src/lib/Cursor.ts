import { DrawingOptions } from "./Annotator";
import Highlighter, {
  defaultStyle,
  IAbsCoordinates,
  IRelativeCoordinates,
} from "./Highlighter";
import Text, { CaretAffinity } from "./Text";
import Viewport from "./Viewport";
import { HighlightMode } from "./constants";

export enum DIRECTION {
  FORWARD = "FORWARD",
  BACKWARD = "BACKWARD",
}
/**
 * Cursor represents active position in the document with highlighting capabilities.
 * xLine and yLine are always in absolute (document) coordinates, like Google Docs.
 */
export default class Cursor
  extends Highlighter
  implements IRelativeCoordinates
{
  /** Absolute character index within the line (0-based). */
  xLine: number;
  /** Absolute line index in the document (0-based). */
  yLine: number;
  /** Desired column for vertical movement; null = follow xLine. Reset on any horizontal move/edit/click. */
  goalColumn: number | null = null;
  /**
   * Phase 5 — desired PIXEL x for vertical movement in proportional mode,
   * resolved to the nearest column on each target line via `pixelXToColumn`.
   *
   * Captured in the CAPTURE block of Keys.onArrowUp/onArrowDown, guarded by
   * `goalColumn === null`, so it is always re-derived (before the USE in the same
   * handler) whenever the goal was cleared. It therefore persists across
   * consecutive vertical moves AND across horizontal moves (which, by design, do
   * not clear the goal), and is only stale if the text layout changes mid-goal —
   * acceptable, since edits clear the goal. Null/ignored on the monospace path;
   * the USE guard (`proportional && goalPixelX !== null`) keeps it safe if the
   * flag is toggled, falling back to the char-count {@link goalColumn}.
   */
  goalPixelX: number | null = null;

  /**
   * Phase 3 offset model (additive; not yet wired into navigation). Canonical
   * caret/selection state as raw document offsets (indices into `Text.value`):
   * `head` is the moving caret, `anchor` the fixed selection end. Collapsed
   * selection ⇔ `anchor === head`. `xLine`/`yLine` are derived from these.
   */
  anchor: number = 0;
  head: number = 0;
  /** Affinity for `head`/`anchor` at a soft-wrap boundary (see {@link CaretAffinity}). */
  headAffinity: CaretAffinity = CaretAffinity.DOWNSTREAM;
  anchorAffinity: CaretAffinity = CaretAffinity.DOWNSTREAM;

  selectDirection?: DIRECTION;

  // highlighted area must use absolute coordinates - highlighted area stays in position while scrolling
  private selecting: boolean = false;

  constructor(ratio: number, xLine: number = -1, yLine: number = -1) {
    super(ratio, defaultStyle, HighlightMode.SELECT);
    this.xLine = xLine;
    this.yLine = yLine;
    this.style = { ...this.style, color: "black" };
  }

  setTrueSelectionDirection() {
    if (this.selectStart && this.selectEnd) {
      if (this.selectStart.yLine < this.selectEnd.yLine) {
        // start is above end
        this.selectDirection = DIRECTION.FORWARD;
        return;
      } else if (this.selectStart.yLine > this.selectEnd.yLine) {
        // start is below end
        this.selectDirection = DIRECTION.BACKWARD;
        return;
      } else {
        // the same line
        if (this.selectStart.xLine < this.selectEnd.xLine) {
          // start is before end on horizontal axis
          this.selectDirection = DIRECTION.FORWARD;
          return;
        } else if (this.selectStart.xLine > this.selectEnd.xLine) {
          // start is after end on horizontal axis
          this.selectDirection = DIRECTION.BACKWARD;
          return;
        }
      }
    }

    this.selectDirection = undefined;
  }

  getSelectionDirection(): DIRECTION | undefined {
    if (this.selectStart && this.selectEnd) {
      return this.selectDirection;
    }

    return undefined;
  }

  setPosition(lineX: number, lineY: number) {
    this.xLine = lineX;
    this.yLine = lineY;
    this.goalColumn = null;
  }

  /**
   * Phase 3 offset model — derive the cached visual caret (`xLine`/`yLine`) and
   * the selection's visual endpoints from the canonical `head`/`anchor` offsets.
   * Selection is collapsed (start/end cleared) when `anchor === head`. The draw
   * pipeline keeps reading `xLine`/`yLine`, so this is the bridge that keeps the
   * visual state in sync after any offset mutation.
   */
  syncVisualFromOffset(text: Text) {
    const headVisual = text.visualFromOffset(this.head, this.headAffinity);
    if (headVisual) {
      this.xLine = headVisual.xLine;
      this.yLine = headVisual.yLine;
    }

    if (this.anchor === this.head) {
      this.selectStart = undefined;
      this.selectEnd = undefined;
    } else {
      const anchorVisual = text.visualFromOffset(
        this.anchor,
        this.anchorAffinity
      );
      if (anchorVisual && headVisual) {
        this.selectStart = {
          xLine: anchorVisual.xLine,
          yLine: anchorVisual.yLine,
        };
        this.selectEnd = { xLine: headVisual.xLine, yLine: headVisual.yLine };
      }
    }

    this.setTrueSelectionDirection();
  }

  /**
   * Phase 3 offset model — place a COLLAPSED caret at a raw document offset and
   * derive the visual position. Clears any selection (anchor === head) and the
   * goal column. The canonical way to position the caret after an edit: the
   * post-edit offset is known exactly, and deriving the visual from it is always
   * in bounds (replaces `move()` + `fixOutOfBounds`).
   */
  moveToOffset(
    text: Text,
    offset: number,
    affinity: CaretAffinity = CaretAffinity.DOWNSTREAM
  ) {
    this.head = offset;
    this.anchor = offset;
    this.headAffinity = affinity;
    this.anchorAffinity = affinity;
    this.goalColumn = null;
    this.syncVisualFromOffset(text);
  }

  /**
   * Phase 3 offset model — reconcile the canonical `head`/`anchor` offsets with
   * the current VISUAL caret + selection. Needed because `setPosition`,
   * `setMode` and mouse handlers set `xLine`/`yLine` (and `selectStart`/`End`)
   * without touching the offsets, so they can be stale at the start of a key.
   * `head` follows the caret; `anchor` follows the non-caret selection end (or
   * collapses to `head` when there is no active selection).
   */
  reconcileOffsetsFromVisual(text: Text) {
    if (this.xLine < 0 || this.yLine < 0) {
      return;
    }
    const headInfo = text.offsetWithAffinityFromVisual(this.xLine, this.yLine);
    if (headInfo.offset < 0) {
      return;
    }
    this.head = headInfo.offset;
    this.headAffinity = headInfo.affinity;

    if (this.selectStart && this.selectEnd && this.isSelected()) {
      const caretAtStart =
        this.xLine === this.selectStart.xLine &&
        this.yLine === this.selectStart.yLine;
      const anchorPt = caretAtStart ? this.selectEnd : this.selectStart;
      const anchorInfo = text.offsetWithAffinityFromVisual(
        anchorPt.xLine,
        anchorPt.yLine
      );
      this.anchor = anchorInfo.offset;
      this.anchorAffinity = anchorInfo.affinity;
    } else {
      this.anchor = this.head;
      this.anchorAffinity = this.headAffinity;
    }
  }

  /**
   * Phase 3 offset model — derive `head` (and `anchor` unless `keepAnchor`) from
   * the current visual caret. Used at the boundary while navigation still
   * mutates `xLine`/`yLine` directly (before Tasks 3.2–3.5 migrate them).
   * Out-of-bounds visual coords leave the offsets unchanged.
   */
  syncOffsetFromVisual(text: Text, keepAnchor: boolean = false) {
    const { offset, affinity } = text.offsetWithAffinityFromVisual(
      this.xLine,
      this.yLine
    );
    if (offset < 0) {
      return;
    }
    this.head = offset;
    this.headAffinity = affinity;
    if (!keepAnchor) {
      this.anchor = offset;
      this.anchorAffinity = affinity;
    }
  }

  /**
   * Issue #3108 — compare two absolute visual positions in document order.
   * Returns <0 if `a` is before `b`, 0 if equal, >0 if `a` is after `b`.
   */
  private static compareVisual(
    a: IAbsCoordinates,
    b: IAbsCoordinates
  ): number {
    if (a.yLine !== b.yLine) {
      return a.yLine - b.yLine;
    }
    return a.xLine - b.xLine;
  }

  /**
   * Issue #3108 — move ONE selection boundary (the start or end drag handle) to a
   * new visual position while keeping the other boundary fixed. Enforces a minimum
   * of one VISIBLE character selected and prevents the dragged boundary from
   * crossing (reversing past) the fixed one. `which` refers to the document-ordered
   * start or end of the current selection. The canonical offset model is kept in
   * sync with `head` tracking the moving boundary and `anchor` the fixed one.
   *
   * The min-1-char clamp is computed in VISIBLE-column space (stepVisualLeft/Right)
   * so it holds across soft-wrap boundaries and skips hidden tag markup in
   * HIGHLIGHT/SEMI mode, where adjacent visible columns map to non-adjacent offsets.
   */
  dragBoundary(
    text: Text,
    which: "start" | "end",
    xLine: number,
    yLine: number
  ): void {
    const [start, end] = this.getAbsBounds();
    if (!start || !end) {
      return;
    }

    const requested = text.clampVisual(xLine, yLine);

    let movingPt: IAbsCoordinates;
    let fixedPt: IAbsCoordinates;

    if (which === "start") {
      fixedPt = end;
      // Max start = one visible column left of the end → keeps >= 1 char selected.
      const maxStart = text.stepVisualLeft(end.xLine, end.yLine);
      movingPt =
        Cursor.compareVisual(requested, maxStart) <= 0 ? requested : maxStart;
      this.selectStart = movingPt;
      this.selectEnd = fixedPt;
    } else {
      fixedPt = start;
      // Min end = one visible column right of the start → keeps >= 1 char selected.
      const minEnd = text.stepVisualRight(start.xLine, start.yLine);
      movingPt =
        Cursor.compareVisual(requested, minEnd) >= 0 ? requested : minEnd;
      this.selectStart = fixedPt;
      this.selectEnd = movingPt;
    }

    this.xLine = movingPt.xLine;
    this.yLine = movingPt.yLine;

    const headInfo = text.offsetWithAffinityFromVisual(
      movingPt.xLine,
      movingPt.yLine
    );
    const anchorInfo = text.offsetWithAffinityFromVisual(
      fixedPt.xLine,
      fixedPt.yLine
    );
    this.head = headInfo.offset;
    this.headAffinity = headInfo.affinity;
    this.anchor = anchorInfo.offset;
    this.anchorAffinity = anchorInfo.affinity;
    this.goalColumn = null;

    this.setTrueSelectionDirection();
  }

  /**
   * Issue #3108 — set the selection to an explicit raw-offset span (used while
   * dragging the whole highlight). Offsets are clamped into the document and the
   * span is oriented forward (anchor = start, head = end); the visual endpoints
   * are derived via {@link syncVisualFromOffset}.
   */
  setSpanByOffsets(text: Text, startOffset: number, endOffset: number): void {
    const max = text.value.length;
    const s = Math.max(0, Math.min(startOffset, max));
    const e = Math.max(0, Math.min(endOffset, max));
    this.anchor = Math.min(s, e);
    this.head = Math.max(s, e);
    this.anchorAffinity = CaretAffinity.DOWNSTREAM;
    this.headAffinity = CaretAffinity.DOWNSTREAM;
    this.goalColumn = null;
    this.syncVisualFromOffset(text);
  }

  /**
   * Sets cursor position from a mouse event. Stores absolute document coordinates.
   * @param viewportLineStart - Absolute line index of the first visible line (used to convert click to absolute yLine).
   */
  setPositionFromEvent(
    evt: MouseEvent,
    lineHeight: number,
    charWidth: number,
    scrollOffsetY: number = 0,
    viewportLineStart: number = 0,
    pixelXToColumn?: (absLine: number, deviceX: number) => number
  ) {
    this.setPositionFromCanvasOffsets(
      evt.offsetX,
      evt.offsetY,
      lineHeight,
      charWidth,
      scrollOffsetY,
      viewportLineStart,
      pixelXToColumn
    );
  }

  /**
   * Same as setPositionFromEvent but with explicit canvas offsets (e.g. from client coords).
   *
   * Phase 5 — when `pixelXToColumn` is supplied (proportional), the column is
   * resolved from the prefix table of the clicked line via measured widths, so
   * `yLine` is computed first and `offsetX` is scaled CSS→device px (× ratio) to
   * match the device-px prefix table. Without it, the legacy `xToCharI` is used.
   */
  setPositionFromCanvasOffsets(
    offsetX: number,
    offsetY: number,
    lineHeight: number,
    charWidth: number,
    scrollOffsetY: number = 0,
    viewportLineStart: number = 0,
    pixelXToColumn?: (absLine: number, deviceX: number) => number
  ) {
    const relY = Math.max(
      0,
      Math.floor((offsetY * this.ratio + scrollOffsetY) / lineHeight)
    );
    this.yLine = viewportLineStart + relY;
    this.xLine = pixelXToColumn
      ? pixelXToColumn(this.yLine, Math.max(offsetX, 0) * this.ratio)
      : this.xToCharI(offsetX, charWidth);
    this.goalColumn = null;
  }

  /**
   * isSelecting is predicate for testing if any mouse-move event should update selected area (click+move)
   * @returns
   */
  isSelecting(): boolean {
    return this.selecting;
  }

  /**
   * isSelected is predicate for testing if selected area has been set - should be drawn
   * @returns
   */
  isSelected(): boolean {
    return (
      !!this.selectStart &&
      !!this.selectEnd &&
      (this.selectStart.xLine !== this.selectEnd.xLine ||
        this.selectStart.yLine !== this.selectEnd.yLine)
    );
  }

  /**
   * Whether a collapsed caret is currently shown: the cursor is placed (not the
   * initial -1/-1 sentinel) and there is no active selection. Used to gate the
   * blink timer so it stays idle when there is nothing to blink (#3092).
   */
  hasCaret(): boolean {
    return !this.isSelected() && !(this.xLine === -1 && this.yLine === -1);
  }

  /**
   * getSelectedArea return null if area is empty (no char selected)
   * @returns
   */
  getSelectedArea(): [IAbsCoordinates, IAbsCoordinates] | null {
    const selected = this.getAbsBounds();
    if (
      selected[0] === undefined ||
      selected[1] === undefined ||
      (selected[0].xLine === selected[1].xLine &&
        selected[0].yLine === selected[1].yLine)
    ) {
      return null;
    }

    return [selected[0], selected[1]];
  }

  /**
   * getAbsBounds is getter for absolute selected coordinates start->end
   * @returns
   */
  getAbsBounds(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
    if (!this.selectStart || !this.selectEnd) {
      return [undefined, undefined];
    }

    if (
      this.selectStart.yLine < this.selectEnd.yLine ||
      (this.selectStart.yLine === this.selectEnd.yLine &&
        this.selectStart.xLine < this.selectEnd.xLine)
    ) {
      return [this.selectStart, this.selectEnd];
    } else {
      return [this.selectEnd, this.selectStart];
    }
  }

  /**
   * Updates selected area to current cursor position (absolute coordinates).
   * Either sets both start/end (initial click) or only end (dragging).
   */
  selectArea() {
    if (!this.selecting) {
      this.selectStart = { xLine: this.xLine, yLine: this.yLine };
      this.selectEnd = { xLine: this.xLine, yLine: this.yLine };
      this.selecting = true;
    } else {
      this.selectEnd = { xLine: this.xLine, yLine: this.yLine };
    }

    this.setTrueSelectionDirection();
  }

  /**
   * endHighlight marks final position for highlighted area by setting control flag to false
   */
  endSelection() {
    this.selecting = false;
  }

  /**
   * move alters the cursor position by provided delta increments
   * @param xDelta
   * @param yDelta
   * @returns
   */
  move(xDelta: number, yDelta: number) {
    if (!xDelta && !yDelta) {
      return;
    }

    let newX = this.xLine + xDelta;
    let newY = this.yLine + yDelta;

    if (newX < 0) {
      newX = 0;
    }
    if (newY < 0) {
      newY = 0;
    }

    this.xLine = newX;
    this.yLine = newY;
  }

  /**
   * draw places cursor and optionally highlighted area into the canvas
   * @param ctx
   * @param viewport
   * @param text
   * @param options
   * @returns
   */
  draw(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    text: Text,
    drawingOptions: DrawingOptions
  ) {
    if (this.xLine === -1 && this.yLine === -1) {
      return;
    }

    let [hStart, hEnd] = this.getAbsBounds();

    const rowsToDraw: { rowI: number; start: number; end: number }[] = [];

    if (!this.isSelected()) {
      // Draw caret at viewport-relative row (cursor stores absolute position),
      // unless the blink is in its hidden phase (#3092).
      const relY = this.yLine - viewport.lineStart;
      if (
        drawingOptions.caretVisible !== false &&
        relY >= 0 &&
        relY <= viewport.noLines
      ) {
        this.drawLine(
          ctx,
          relY,
          this.xLine,
          this.xLine,
          {
            ...drawingOptions,
            color: this.style.selectorColor,
          },
          this.yLine
        );
      }
    } else if (hStart && hEnd) {
      // selection active, iterate over displayed lines
      for (
        let i = 0;
        i <= Math.min(viewport.lineEnd, text.noLines) - viewport.lineStart;
        i++
      ) {
        const currY = viewport.lineStart + i;
        const lastCharX = text.getLine(currY).length;

        if (hStart.yLine <= currY && hEnd.yLine >= currY) {
          if (hStart.yLine === currY) {
            // opening highlight line
            rowsToDraw.push({
              rowI: i,
              start: hStart.xLine,
              end: hStart.yLine === hEnd.yLine ? hEnd.xLine : lastCharX + 1,
            });
          } else if (hEnd.yLine === currY) {
            // closing highlight line
            rowsToDraw.push({ rowI: i, start: 0, end: hEnd.xLine });
          } else {
            // full line highlight (between open & end)
            rowsToDraw.push({
              rowI: i,
              start: 0,
              end: lastCharX + 1,
            });
          }
        }
      }

      // draw selections or cursor
      for (const row of rowsToDraw) {
        this.drawLine(
          ctx,
          row.rowI,
          row.start,
          row.end,
          drawingOptions,
          viewport.lineStart + row.rowI
        );
      }
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Reset the cursor properties - removes highlighting / cursor pointer
   */
  reset() {
    this.selectStart = undefined;
    this.selectEnd = undefined;
    this.xLine = -1;
    this.yLine = -1;
  }

  resetHighlight() {
    this.selectStart = undefined;
    this.selectEnd = undefined;
  }

  getAbsolutePosition(_viewport?: Viewport): IAbsCoordinates {
    return { xLine: this.xLine, yLine: this.yLine };
  }

  /** Viewport-relative line index for drawing; -1 if above view, > noLines if below. */
  getViewportY(viewport: Viewport): number {
    return this.yLine - viewport.lineStart;
  }
}
