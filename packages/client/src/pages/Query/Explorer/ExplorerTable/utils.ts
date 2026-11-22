import {
  IEntity,
  IProp,
  IReference,
  IResponseQueryEntity,
  IUser,
} from "@inkvisitor/shared/types";
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

/**
 * The width of every column once the columns share the space the table leaves
 * free in `available` (px, the entity column included) in equal parts. Each
 * keeps its own width (`baseWidths`, else its type's width) as the minimum, so
 * a table wider than `available` keeps its widths and scrolls.
 */
export const fillColumnWidths = (
  columns: Explore.IExploreColumn[],
  baseWidths: Record<string, number>,
  available: number,
  firstColumnWidth: number,
): Record<string, number> => {
  const widths: Record<string, number> = {};
  let used = firstColumnWidth;
  for (const column of columns) {
    widths[column.id] = baseWidths[column.id] ?? getColumnWidth(column.type);
    used += widths[column.id];
  }
  const share = columns.length ? Math.floor((available - used) / columns.length) : 0;
  if (share > 0) {
    for (const column of columns) {
      widths[column.id] += share;
    }
  }
  return widths;
};

/**
 * The label width (px) that lets a cell of `width` show `displayLimit` tags
 * side by side, with the overflow chip and, in an editable column, the
 * suggester and the unlink buttons; undefined while that is no more than the
 * tag's default label width, which then applies.
 */
export const getTagLabelMaxWidth = (
  column: Explore.IExploreColumn,
  width: number,
  displayLimit: number,
): number | undefined => {
  const free =
    width -
    CELL_PADDING_PX -
    OVERFLOW_CHIP_PX -
    (column.editable ? SUGGESTER_PX + CELL_GAP_PX : 0);
  const perTag = Math.floor(free / displayLimit) - CELL_GAP_PX;
  const label = perTag - TAG_MARKER_PX - (column.editable ? TAG_BUTTON_PX : 0);
  return label > TAG_LABEL_MAX_PX ? label : undefined;
};

// A value column (EPV) shows one tag per top-level metaprop of its type, in props
// order, so the n-th tag of a value stands for the n-th metaprop with that value.
const isPropPair = (prop: IProp, typeId: string, valueId: string): boolean =>
  prop.type?.entityId === typeId && prop.value?.entityId === valueId;

/** whether `props` hold a top-level metaprop of `typeId` whose value is `valueId` */
export const hasPropPair = (props: IProp[], typeId: string, valueId: string): boolean =>
  props.some((prop) => isPropPair(prop, typeId, valueId));

/**
 * `props` without the `occurrence`-th (counted from 0) top-level metaprop of `typeId` whose
 * value is `valueId`
 */
export const withoutNthPropPair = (
  props: IProp[],
  typeId: string,
  valueId: string,
  occurrence: number,
): IProp[] => {
  let seen = -1;
  return props.filter((prop) => !(isPropPair(prop, typeId, valueId) && ++seen === occurrence));
};

// A reference value column (ERV) lists the values of the row's references to its
// resource, each value once, so one tag stands for every such reference.
const isReferencePair = (reference: IReference, resourceId: string, valueId: string): boolean =>
  reference.resource === resourceId && reference.value === valueId;

/** whether `references` hold one to `resourceId` whose value is `valueId` */
export const hasReferencePair = (
  references: IReference[],
  resourceId: string,
  valueId: string,
): boolean => references.some((reference) => isReferencePair(reference, resourceId, valueId));

/** `references` without those to `resourceId` whose value is `valueId` */
export const withoutReferencePair = (
  references: IReference[],
  resourceId: string,
  valueId: string,
): IReference[] =>
  references.filter((reference) => !isReferencePair(reference, resourceId, valueId));
