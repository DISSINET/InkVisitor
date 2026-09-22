import { DropdownItem } from "@inkvisitor/shared/types";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * Arranging the Locations list, without changing what is in it.
 *
 * The list is the page's one statement about what is being worked on, so
 * choosing how it is arranged must never change which Locations it holds. That
 * is the whole difference between this and the filter it replaces: a Location
 * that has just been given a coordinate moves from one group to the other and
 * stays on screen, rather than dropping out of the view that was showing it.
 */

export type GroupBy = "coords" | "placeType" | "language" | "status" | "none";

export const groupByOptions: DropdownItem[] = [
  { value: "coords", label: "coordinates" },
  { value: "placeType", label: "kind of place" },
  { value: "language", label: "language" },
  { value: "status", label: "status" },
  { value: "none", label: "nothing — one list" },
];

export interface LocationGroup {
  key: string;
  label: string;
  /** The rows actually drawn, which a collapsed group narrows. */
  rows: GeocodingLocation[];
  /** How many the group holds, drawn or not. */
  total: number;
  collapsed: boolean;
}

/** Which groups are collapsed, by group key. */
export type Collapsed = Record<string, boolean>;

/**
 * What a collapsed group still shows.
 *
 * Not nothing: a group collapsed to zero rows would hide the coordinate just
 * written, which is the one row the researcher needs to see. A collapsed group
 * shows this session's own writes and nothing else — so a fresh load opens with
 * the boundary at the top of the list, and every accepted coordinate appears
 * directly above it.
 */
const collapsedRows = (rows: GeocodingLocation[], writeOrder: WriteOrder) =>
  rows.filter((row) => writeOrder[row.entity.id] !== undefined);

const group = (
  key: string,
  label: string,
  rows: GeocodingLocation[],
  writeOrder: WriteOrder,
  collapsed: Collapsed,
): LocationGroup => {
  const isCollapsed = !!collapsed[key];
  return {
    key,
    label,
    rows: isCollapsed ? collapsedRows(rows, writeOrder) : rows,
    total: rows.length,
    collapsed: isCollapsed,
  };
};

/**
 * When each Location was written in this session, by entity id.
 *
 * Session-scoped on purpose. It orders the geocoded group so that what was just
 * finished sits at its end, immediately above the boundary with what is left to
 * do — which is where the researcher is working. Nothing is persisted, so a
 * reload gives back the collection's own order and the boundary is wherever the
 * corpus puts it.
 */
export type WriteOrder = Record<string, number>;

/**
 * The geocoded rows, with this session's writes at the end in the order they
 * were made.
 *
 * A Location the researcher has not touched keeps the collection's order, so
 * the group does not reshuffle around them as they work.
 */
const inWriteOrder = (rows: GeocodingLocation[], writeOrder: WriteOrder) =>
  [...rows].sort(
    (one, other) =>
      (writeOrder[one.entity.id] || 0) - (writeOrder[other.entity.id] || 0),
  );

/**
 * Bucketing by a field a Location may not carry.
 *
 * A Location with no value gets a named group rather than being dropped: the
 * list holds the same rows under every arrangement, and "no kind recorded" is
 * frequently the group a researcher is looking for.
 */
const bucketBy = (
  rows: GeocodingLocation[],
  valueOf: (location: GeocodingLocation) => string | null | undefined,
  missingLabel: string,
  writeOrder: WriteOrder,
  collapsed: Collapsed,
): LocationGroup[] => {
  const buckets = new Map<string, GeocodingLocation[]>();
  for (const row of rows) {
    const value = valueOf(row);
    const label = value === null || value === undefined || value === "" ? missingLabel : value;
    const held = buckets.get(label);
    if (held) {
      held.push(row);
    } else {
      buckets.set(label, [row]);
    }
  }
  return [...buckets.entries()]
    // the group for Locations carrying no value sorts last whatever it is
    // called, because it is the one group that is about absence
    .sort(([one], [other]) =>
      one === missingLabel
        ? 1
        : other === missingLabel
          ? -1
          : one.localeCompare(other),
    )
    .map(([label, groupRows]) => group(label, label, groupRows, writeOrder, collapsed));
};

/**
 * The list, arranged.
 *
 * Under `coords` the geocoded group is drawn first. That order is the argument:
 * the boundary between the two groups is where the work happens, so the
 * Location just finished sits directly above it and the next one to do directly
 * below, and a write moves a row a few pixels rather than out of sight.
 */
export const groupsOf = (
  locations: GeocodingLocation[],
  groupBy: GroupBy,
  writeOrder: WriteOrder,
  collapsed: Collapsed = {},
): LocationGroup[] => {
  if (groupBy === "none") {
    return [group("all", "all locations", locations, writeOrder, collapsed)];
  }

  if (groupBy === "coords") {
    return [
      group(
        "geocoded",
        "geocoded",
        inWriteOrder(
          locations.filter((location) => location.isGeocoded),
          writeOrder,
        ),
        writeOrder,
        collapsed,
      ),
      group(
        "ungeocoded",
        "no coordinates",
        locations.filter((location) => !location.isGeocoded),
        writeOrder,
        collapsed,
      ),
    ];
  }

  if (groupBy === "placeType") {
    return bucketBy(
      locations,
      (location) => location.placeType,
      "no kind recorded",
      writeOrder,
      collapsed,
    );
  }
  if (groupBy === "language") {
    return bucketBy(
      locations,
      (location) => location.entity.language,
      "no language recorded",
      writeOrder,
      collapsed,
    );
  }
  return bucketBy(
    locations,
    (location) => location.entity.status,
    "no status recorded",
    writeOrder,
    collapsed,
  );
};

/**
 * One line of the virtualised list: a group's heading, or a Location.
 *
 * Headings are rows rather than sticky bars because the list is virtualised and
 * `react-window` has no sticky-header support — a heading that pretended to
 * stick would have to be lifted out of the scroller, which is a different
 * component rather than a different style.
 */
export type ListItem =
  | { kind: "header"; group: LocationGroup }
  | { kind: "row"; location: GeocodingLocation };

/**
 * The groups as one addressable sequence.
 *
 * An empty group keeps its heading. Under `coords` that heading is the thing
 * that says the work is finished — a list with nothing left to do and no "no
 * coordinates" heading reads as a list that failed to load.
 */
export const flatten = (groups: LocationGroup[]): ListItem[] =>
  groups.flatMap((group) => [
    { kind: "header", group } as ListItem,
    ...group.rows.map((location) => ({ kind: "row", location }) as ListItem),
  ]);

/**
 * The entity ids of the rows between two points in the flattened list.
 *
 * Headings inside the run are skipped rather than rejected: a shift-click run
 * is a stretch of what is on screen, and a heading sitting inside it marks
 * nothing itself. The two endpoints are read in whichever order they come, so
 * a run marked upward reaches the same rows as one marked downward.
 */
export const idsInRange = (items: ListItem[], from: number, to: number): string[] => {
  const [start, end] = from <= to ? [from, to] : [to, from];
  return items
    .slice(start, end + 1)
    .filter((item): item is Extract<ListItem, { kind: "row" }> => item.kind === "row")
    .map((item) => item.location.entity.id);
};

/**
 * Where a group's heading sits in the flattened list.
 *
 * The index the scroller is asked to go to when a group is chosen from the
 * index above the list. -1 where the group is not in the list at all, which is
 * the state between choosing a different arrangement and the list being rebuilt
 * around it — a scroll to -1 would land at the top and read as the list having
 * jumped for no reason.
 */
export const headerIndexOf = (items: ListItem[], key: string): number =>
  items.findIndex((item) => item.kind === "header" && item.group.key === key);

/**
 * Where each group's heading sits, in pixels down the list.
 *
 * Computed rather than measured, because the list is virtualised: a heading that
 * has scrolled out is not in the document to be measured, and those are exactly
 * the ones a caller needs the position of.
 */
export const headingOffsets = (
  items: ListItem[],
  headingHeight: number,
  rowHeight: number,
): Map<string, number> => {
  const at = new Map<string, number>();
  let offset = 0;
  for (const item of items) {
    if (item.kind === "header") {
      at.set(item.group.key, offset);
      offset += headingHeight;
    } else {
      offset += rowHeight;
    }
  }
  return at;
};

/**
 * Where the list has to scroll for a group to arrive in sight.
 *
 * Not to the group's own offset. Every heading before it stays parked against
 * the top edge once it arrives, and those bars are drawn over the list — so a
 * scroll to the group's own offset puts it exactly underneath them and the
 * group appears to vanish rather than to arrive. The destination is therefore
 * short by the height of the bars that will still be there.
 *
 * Null where the group is not in the list, which is the state between choosing
 * a different arrangement and the list being rebuilt around it.
 */
export const scrollTargetFor = (
  groups: { key: string }[],
  offsets: Map<string, number>,
  headingHeight: number,
  key: string,
): number | null => {
  const offset = offsets.get(key);
  if (offset === undefined) {
    return null;
  }
  const above = groups.filter((group) => {
    const other = offsets.get(group.key);
    return other !== undefined && other < offset;
  }).length;
  return Math.max(0, offset - above * headingHeight);
};

/**
 * Which headings have left the viewport, and by which edge.
 *
 * A heading still showing any part of itself counts as visible and is in
 * neither list — parking it while it is on screen would put the same label
 * twice on one screen, which is the whole thing this avoids.
 */
export const parkedHeadings = <T extends { key: string }>(
  groups: T[],
  offsets: Map<string, number>,
  headingHeight: number,
  view: { top: number; height: number },
): { above: T[]; below: T[] } => {
  const above: T[] = [];
  const below: T[] = [];
  // an unmeasured viewport has nothing off screen: parking every heading at
  // once is what a height of zero would otherwise mean
  if (view.height <= 0) {
    return { above, below };
  }
  for (const group of groups) {
    const offset = offsets.get(group.key);
    if (offset === undefined) {
      continue;
    }
    if (offset + headingHeight <= view.top) {
      above.push(group);
    } else if (offset >= view.top + view.height) {
      below.push(group);
    }
  }
  return { above, below };
};

/**
 * The group whose rows are on screen, given the first item the list has drawn.
 *
 * The first row at or after the index, and then that row's own heading. Taking
 * the nearest heading backwards instead would name a collapsed group that draws
 * nothing while the rows actually visible belong to the next one — which is the
 * state a part-finished corpus opens in.
 *
 * The backward scan is still what finds the heading: a virtualised list has
 * usually not rendered the heading for the rows at the top of the viewport.
 */
export const groupAtIndex = (items: ListItem[], index: number): LocationGroup | null => {
  const from = Math.max(0, Math.min(index, items.length - 1));
  let at = from;
  while (at < items.length && items[at].kind !== "row") {
    at += 1;
  }
  // nothing but headings from here down: the last one is what the reader sees
  if (at >= items.length) {
    at = from;
  }
  for (; at >= 0; at -= 1) {
    const item = items[at];
    if (item?.kind === "header") {
      return item.group;
    }
  }
  return null;
};

/**
 * Which groups a fresh page collapses.
 *
 * The geocoded group, because a corpus part-way through holds a thousand
 * finished Locations and four hundred left to do — landing at the top of the
 * finished ones puts the work a thousand rows below the fold. Collapsed, the
 * boundary is the first thing on screen.
 */
export const COLLAPSED_BY_DEFAULT: Collapsed = { geocoded: true };

/**
 * Where a Location's row sits in the scroller, in pixels from the top.
 *
 * Null where the list holds no row for it — a Location inside a collapsed
 * group has none, and neither has one the current filters exclude.
 */
export const rowOffsetOf = (
  items: ListItem[],
  entityId: string,
  headingHeight: number,
  rowHeight: number,
): number | null => {
  let offset = 0;
  for (const item of items) {
    if (item.kind === "row" && item.location.entity.id === entityId) {
      return offset;
    }
    offset += item.kind === "header" ? headingHeight : rowHeight;
  }
  return null;
};

/**
 * Where the list has to scroll for a row to be worth looking at, or null if it
 * already is.
 *
 * Centred rather than nudged to the nearest edge. A row arriving from the map
 * is read together with its neighbours — which group it fell in, what sits
 * either side of it — and a row scrolled to the last pixel of the viewport
 * shows none of that. Centring also settles the parked headings on its own:
 * those bars are drawn over the top and bottom of the list, and a row in the
 * middle is nowhere near either.
 *
 * `padTop` and `padBottom` are the heights those bars currently take, and so
 * count as covered rather than visible — a row underneath one is on screen and
 * cannot be seen.
 */
export const revealRowTarget = (
  offset: number,
  rowHeight: number,
  view: { top: number; height: number },
  padTop: number,
  padBottom: number,
): number | null => {
  // an unmeasured viewport can say nothing about what is visible in it, and
  // centring against a height of zero would scroll the row to the very top
  if (view.height <= 0) {
    return null;
  }
  const from = view.top + padTop;
  const to = view.top + view.height - padBottom;
  if (offset >= from && offset + rowHeight <= to) {
    return null;
  }
  return Math.max(0, offset - (view.height - rowHeight) / 2);
};
