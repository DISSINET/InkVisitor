import { DrawingOptions } from "./Annotator";
import Text from "./Text";
import Viewport from "./Viewport";
import {
  HIGHLIGHT_HEIGHT_RATIO,
  HIGHLIGHT_SPAN_EDGE_GAP_PX,
  HighlightMode,
  UNDERLINE_OFFSET_PX,
} from "./constants";

// Absolute coordinates point to virtual position not limited by viewport - first line is first line of input
export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

export interface CursorStyle {
  color: string;
  opacity: number;
  selectorColor: string;
}

export const defaultStyle: CursorStyle = {
  color: "black",
  opacity: 0.7,
  selectorColor: "black",
};

// Relative coordinates point to position relative to viewport - first line is topmost rendered line
export interface IRelativeCoordinates extends IAbsCoordinates {}

/**
 * Which outer edges of a span a drawn row carries (#2325). A row of a wrapped
 * span holds the start on its first line and the end on its last; the lines
 * between hold neither, and their edges are soft wraps rather than span bounds.
 */
export interface SpanEdges {
  start?: boolean;
  end?: boolean;
}

/**
 * Cursor represents active position in the viewport with highlighting capabilities (marking start - end in absolute coordinates)
 */
export default class Highlighter {
  ratio: number;

  style: CursorStyle;

  hlMode: HighlightMode;

  selectStart?: IAbsCoordinates;
  selectEnd?: IAbsCoordinates;

  constructor(
    ratio: number,
    style: Partial<CursorStyle> = defaultStyle,
    hlMode: HighlightMode = HighlightMode.SELECT
  ) {
    this.style = { ...defaultStyle, ...style };
    this.hlMode = hlMode;

    this.ratio = ratio;
  }

  /**
   * @param style
   * sets the style of the cursor
   */
  setStyle(style: Partial<CursorStyle>) {
    this.style = { ...this.style, ...style };
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.max(0, Math.floor((y / lineHeight) * this.ratio));
  }

  xToCharI(x: number, charWidth: number): number {
    const rel = (Math.max(x, 0) / charWidth) * this.ratio;
    // Place caret to the right when clicking on the right half of a character cell
    return Math.floor(rel + 0.5);
  }

  /**
   * getSelected is getter for absolute selected coordinates
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
   * drawLine is shorthand around drawing highlighted areas simply by providing relative coordinates
   * @param ctx
   * @param relLine
   * @param xStart
   * @param xEnd
   * @param options
   */
  drawLine(
    ctx: CanvasRenderingContext2D,
    relLine: number,
    xStart: number,
    xEnd: number,
    options: DrawingOptions,
    absLine?: number,
    spanEdges?: SpanEdges
  ) {
    const { charWidth, lineHeight, color: colorOverride, columnToPixelX } =
      options;
    // Proportional uses measured widths keyed by the ABSOLUTE line;
    // monospace (no resolver / no absLine) keeps the exact `col * charWidth` grid.
    const toPx =
      columnToPixelX && absLine !== undefined
        ? (col: number) => columnToPixelX(absLine, col)
        : (col: number) => col * charWidth;
    // Column 0 of an indented paragraph line sits at the indent, not at x=0
    // (#2076). A shift, so the span's width is unaffected.
    const originPx =
      options.lineXOrigin && absLine !== undefined
        ? options.lineXOrigin(absLine)
        : 0;
    const xStartPx = toPx(xStart) + originPx;
    const width = toPx(xEnd) - toPx(xStart);
    // const height = this.hlMode === HighlightMode.UNDERLINE ? 3 : lineHeight;

    const isNarrowHighlight =
      this.hlMode === HighlightMode.SELECT ||
      this.hlMode === HighlightMode.BACKGROUND;
    // The band wraps the letters: its height comes from the measured text band
    // when the caller supplies one, and never exceeds the line it sits on.
    const bandHeight = Math.min(
      options.textBandHeight ?? lineHeight * HIGHLIGHT_HEIGHT_RATIO,
      lineHeight
    );
    const height =
      this.hlMode === HighlightMode.UNDERLINE
        ? 3
        : isNarrowHighlight
        ? Math.max(1, bandHeight)
        : lineHeight;
    // Letters sit above the centre of their line box (the em box the text is
    // painted against reserves descender room), so a band centred on the line
    // needs the same shift to stay centred on them.
    const yOffset = isNarrowHighlight
      ? (lineHeight - height) / 2 + (options.textBandOffset ?? 0)
      : 0;
    const y = relLine * lineHeight + yOffset;
    // Bottom of the band, the edge every text-hugging visual is placed against.
    const bandBottom =
      relLine * lineHeight +
      (lineHeight - bandHeight) / 2 +
      (options.textBandOffset ?? 0) +
      bandHeight;

    ctx.fillStyle = colorOverride || this.style.color;
    ctx.globalAlpha = this.style.opacity;

    // An entity span stops a hair short of each of its own outer edges, so two
    // same-colour anchors that touch stay visually separate (#2325). Only the
    // anchor visuals (background fill, underline) take the gaps; the selection
    // and the focus veil are single spans with nothing to be told apart from.
    // A span narrower than the gaps it would give up keeps its full width — the
    // insets may never meet and invert the rect.
    const edgeGap = HIGHLIGHT_SPAN_EDGE_GAP_PX * this.ratio;
    const wantStart = spanEdges?.start ? edgeGap : 0;
    const wantEnd = spanEdges?.end ? edgeGap : 0;
    const insetFits = width > wantStart + wantEnd;
    const startInset = insetFits ? wantStart : 0;
    const endInset = insetFits ? wantEnd : 0;

    if (this.hlMode === "focus") {
      // source-over (not xor): xor over opaque text just fades by alpha and
      // ignores the fill colour, so the veil could never be tinted. source-over
      // lays the actual colour down, so the scrim takes `style.color` (#2887).
      ctx.globalCompositeOperation = "source-over";
      ctx.fillRect(xStartPx, relLine * lineHeight, width, lineHeight);
    } else if (this.hlMode === "underline") {
      ctx.globalCompositeOperation = "multiply";
      // The bar hangs under the letters, clamped to the line it belongs to so a
      // tight spacing cannot push it onto the row below.
      const offsetPx = UNDERLINE_OFFSET_PX * this.ratio;
      const underlineY = Math.min(
        bandBottom + offsetPx,
        (relLine + 1) * lineHeight - height
      );
      ctx.fillRect(
        xStartPx + startInset,
        underlineY,
        width - startInset - endInset,
        height
      );
    } else if (this.hlMode === "background") {
      ctx.globalCompositeOperation = "multiply";
      // width === 0 is an empty (newline-only) line in the span. Without a floor
      // it paints nothing, so a resized anchor vanishes across runs of newlines.
      // minFillWidth keeps a thin sliver visible, like the SELECT caret (#2885).
      // The sliver takes no edge gaps — nothing sits next to it on its line.
      const fillWidth = width || options.minFillWidth || width;
      ctx.fillRect(
        xStartPx + startInset,
        y,
        fillWidth - startInset - endInset,
        height
      );
    } else if (this.hlMode === "select") {
      // A collapsed caret (width === 0) is painted source-over so it stays
      // visible on top of anchor markers / highlights; the "color" blend only
      // tints them and the caret vanishes (#2887). Its alpha comes from
      // caretOpacity — the block (full-width) caret paints half transparent so
      // the letter under it stays readable. Selection spans keep the blend.
      if (width === 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = options.caretOpacity ?? 1;
      } else {
        ctx.globalCompositeOperation = "color";
      }
      // width === 0 means a collapsed caret; honor the configured caret width.
      if (width === 0) {
        // A caret parked in a line's trailing wrap margin — pushed further by
        // the paragraph indent (#2076) — can land past the canvas edge; pin it
        // to the edge so it stays visible (mirrors drawParagraphMark).
        const caretW = options.caretWidth || 1;
        const caretX = Math.min(xStartPx, ctx.canvas.width - caretW);
        ctx.fillRect(caretX, y, caretW, height);
      } else {
        ctx.fillRect(xStartPx, y, width, height);
      }
    }
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
    let [hStart, hEnd] = this.getAbsBounds();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        [hStart, hEnd] = [hEnd, hStart];
      }

      const rowsToDraw: {
        rowI: number;
        start: number;
        end: number;
        // Which of the span's outer edges this row carries (#2325); the edges a
        // row does not carry are soft wraps and must stay flush.
        edges?: SpanEdges;
      }[] = [];

      // Use the same line count as the main text renderer to avoid off-by-one
      // issues where the last visible line has no highlight.
      const visibleLinesCount =
        Math.min(viewport.lineEnd, text.noLines) - viewport.lineStart;

      for (let i = 0; i <= visibleLinesCount; i++) {
        const currY = viewport.lineStart + i;
        const lastCharX = text.getLine(currY).length;

        if (this.hlMode === "focus") {
          // A line fully outside the focused span is dimmed across the ENTIRE
          // editor width, in device px (#2887). A column count can't express
          // "full width" under a proportional font, and it also lets blank or
          // short trailing lines be covered uniformly instead of collapsing to
          // a zero-width strip. `currY < text.noLines` skips the phantom row at
          // index `noLines` (valid lines are [0, noLines-1]) so the veil never
          // paints one line below the last real line at the end of the document.
          if (
            (currY < hStart.yLine || currY > hEnd.yLine) &&
            currY < text.noLines
          ) {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = this.style.opacity;
            ctx.fillStyle = drawingOptions.color || this.style.color;
            ctx.fillRect(
              0,
              i * drawingOptions.lineHeight,
              ctx.canvas.width,
              drawingOptions.lineHeight
            );
          }
          // The territory's own start/end lines only dim the portion of the
          // line outside the span; these stay column-based (correct under a
          // proportional font via drawLine's columnToPixelX).
          if (currY === hStart.yLine) {
            rowsToDraw.push({ rowI: i, start: 0, end: hStart.xLine });
          }
          if (currY === hEnd.yLine) {
            rowsToDraw.push({
              rowI: i,
              start: lastCharX,
              end: hEnd.xLine,
            });
          }
        } else {
          if (hStart.yLine <= currY && hEnd.yLine >= currY) {
            if (hStart.yLine === currY) {
              rowsToDraw.push({
                rowI: i,
                start: hStart.xLine,
                end: hStart.yLine === hEnd.yLine ? hEnd.xLine : lastCharX,
                edges: { start: true, end: hStart.yLine === hEnd.yLine },
              });
            } else if (hEnd.yLine === currY) {
              rowsToDraw.push({
                rowI: i,
                start: 0,
                end: hEnd.xLine,
                edges: { end: true },
              });
            } else {
              rowsToDraw.push({
                rowI: i,
                start: 0,
                end: lastCharX,
              });
            }
          }
        }
      }

      for (const row of rowsToDraw) {
        this.drawLine(
          ctx,
          row.rowI,
          row.start,
          row.end,
          drawingOptions,
          viewport.lineStart + row.rowI,
          row.edges
        );
        //this.xLine = row.end
        // this.yLine = row.rowI
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
  }
}
