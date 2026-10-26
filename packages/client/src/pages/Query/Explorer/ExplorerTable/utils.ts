import { IEntity, IResponseQueryEntity, IUser } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import {
  WIDTH_COLUMN_DEFAULT,
  WIDTH_COLUMN_EUC,
  WIDTH_COLUMN_MAX,
  WIDTH_COLUMN_MIN,
  WIDTH_COLUMN_NARROW,
  WIDTH_COLUMN_WIDE,
} from "./constants";
import { narrowColumnTypes, smallColumnTypes, wideColumnTypes } from "./types";

export const getColumnWidth = (type: Explore.EExploreColumnType): number => {
  if (narrowColumnTypes.has(type)) return WIDTH_COLUMN_NARROW;
  if (smallColumnTypes.has(type)) return WIDTH_COLUMN_EUC;
  if (wideColumnTypes.has(type)) return WIDTH_COLUMN_WIDE;
  return WIDTH_COLUMN_DEFAULT;
};

// --- Content-based column width estimation -------------------------------
// Widths are estimated from the loaded data window (never DOM-measured: rows
// are virtualized, so measuring would loop and jitter with scroll position).
// The estimates are consumed through a ratchet in ExplorerTable - a column
// only ever grows within one query, so scrolling into sparser rows never
// shrinks columns and jumps the layout.

// NOTE: the app root font-size is 62.5%, so 1rem = 10px - all px below are
// calibrated against that.
/** Average glyph width (px) at the cell font size (xs at 10px root). */
const CELL_CHAR_PX = 6;
/** EntityTag label cap: theme.space[30] = 7.5rem = 75px. */
const TAG_LABEL_MAX_PX = 75;
/** EntityTag class-marker square + borders. */
const TAG_MARKER_PX = 24;
/** EntityTag unlink button, shown in editable columns. */
const TAG_BUTTON_PX = 22;
/** Cap for primitive (plain text) cell values. */
const TEXT_MAX_PX = 150;
/** Gap between items inside a cell (0.25rem). */
const CELL_GAP_PX = 4;
/** qt-col horizontal padding (1rem left + 0.3rem right) plus slack. */
const CELL_PADDING_PX = 26;
/** "..." overflow indicator (StyledDots: three glyphs + 0.25rem margin). */
const OVERFLOW_CHIP_PX = 18;
/** Compact EntitySuggester (74px input + button chrome). */
const SUGGESTER_PX = 110;

const getItemLabel = (item: unknown): string => {
  if (item && typeof item === "object") {
    const it = item as Partial<IEntity> & Partial<IUser>;
    return it.labels?.[0] ?? it.name ?? "";
  }
  return String(item ?? "");
};

const estimateItemWidth = (item: unknown, hasUnlink: boolean): number => {
  const labelPx = getItemLabel(item).length * CELL_CHAR_PX;
  // Objects render as tags (EntityTag/UserTag): class marker + label capped at
  // the tag's own max-width + unlink button on editable columns. Primitives
  // render as plain truncated text.
  if (item && typeof item === "object") {
    return TAG_MARKER_PX + Math.min(labelPx, TAG_LABEL_MAX_PX) + (hasUnlink ? TAG_BUTTON_PX : 0);
  }
  return Math.min(labelPx, TEXT_MAX_PX);
};

/**
 * Estimate the width (px) a column needs to show the widest cell in the given
 * data window without truncating item count. `displayLimit` caps how many
 * items a cell renders before collapsing the rest into the overflow chip
 * (CELL_DISPLAY_LIMIT), which also bounds the estimate.
 */
export const estimateColumnWidth = (
  column: Explore.IExploreColumn,
  rows: IResponseQueryEntity[],
  displayLimit: number,
): number => {
  let maxContent = 0;
  for (const row of rows) {
    const cell = row.columnData[column.id];
    const items = Array.isArray(cell)
      ? cell
      : cell !== undefined && cell !== null && cell !== ""
        ? [cell]
        : [];

    let w = 0;
    for (const item of items.slice(0, displayLimit)) {
      w += estimateItemWidth(item, column.editable) + CELL_GAP_PX;
    }
    if (items.length > displayLimit) {
      w += OVERFLOW_CHIP_PX;
    }
    maxContent = Math.max(maxContent, w);
  }

  let width = CELL_PADDING_PX + maxContent;
  if (column.editable) {
    // Editable cells always render the compact suggester next to the content.
    width += SUGGESTER_PX + CELL_GAP_PX;
  }

  // Floor keeps the header (drag handle + label + controls) usable on sparse
  // columns; cap stops a single long row from blowing up the table.
  return Math.min(Math.max(width, WIDTH_COLUMN_MIN), WIDTH_COLUMN_MAX);
};
