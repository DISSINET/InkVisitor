import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  ListItem,
  LocationGroup,
  headingOffsets,
  parkedHeadings,
  revealRowTarget,
  rowOffsetOf,
  scrollTargetFor,
} from "./geocodingGroups";

/**
 * The element the list scrolls in.
 *
 * Found each time rather than held: the list creates it and replaces it on
 * every remount, so a stored reference outlives the thing it points at.
 */
const scrollerIn = (body: HTMLElement) =>
  body.querySelector<HTMLElement>("[role='listbox']");

export interface GeocodingListScroll {
  /** Shared by the scroller and the headings parked against its edges. */
  bodyRef: RefObject<HTMLDivElement | null>;
  /** The headings that have scrolled out of the viewport, and which way. */
  parked: { above: LocationGroup[]; below: LocationGroup[] };
  /** The column the scrollbar reserves, which a parked heading stops short of
   * to line up with the rows it sits above. */
  gutter: number;
  /**
   * Moves the list to a group whose heading has been parked.
   *
   * Only ever called from a parked heading, which by definition names a group
   * that is off screen — the heading of a group in view is in the list, where
   * clicking it collapses the group rather than travelling to it.
   */
  goToGroup: (key: string) => void;
  /**
   * Brings one Location's row into sight, if it is not already there.
   *
   * Takes an entity id rather than a row index because its callers are outside
   * the list — the map's marks and the page's selection — and none of them
   * knows where the list has put a Location, or whether it has put it anywhere.
   */
  goToRow: (entityId: string) => void;
}

/**
 * Tracks what the list's scroller is showing, in pixels, and which group
 * headings that leaves parked against the top or bottom edge.
 *
 * Read off the element rather than taken from the list's own rendered-rows
 * callback: that reports the window it has drawn, which includes overscan and
 * is not the same as what a reader can see.
 */
export const useGeocodingListScroll = (
  groups: LocationGroup[],
  items: ListItem[],
  headingHeight: number,
  rowHeight: number,
): GeocodingListScroll => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 0, gutter: 0 });

  const offsets = useMemo(
    () => headingOffsets(items, headingHeight, rowHeight),
    [items, headingHeight, rowHeight],
  );

  const parked = useMemo(
    () => parkedHeadings(groups, offsets, headingHeight, view),
    [groups, offsets, headingHeight, view],
  );

  /**
   * Listened for on this element rather than on the scroller itself, in the
   * capture phase: the scroller is created by the list and replaced whenever the
   * list remounts, so anything holding a reference to it goes stale. A scroll
   * event does not bubble, but it does capture.
   */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const read = (event?: Event) => {
      const scroller = scrollerIn(body);
      // the event's own target only where it is the list's scroller: a capturing
      // listener hears every scroll inside this element, and reading an
      // unrelated one's position as the list's would park headings against a
      // viewport that is not the list's
      const target = event?.target as HTMLElement | undefined;
      const element = target && target === scroller ? target : scroller;
      if (!element) {
        // no scroller means no list — it has been replaced by the loader or by
        // the empty state. A height of nothing is what says so: it parks no
        // heading, where keeping the last real viewport would park every one of
        // them over a box with no rows to scroll to
        setView((current) => (current.height === 0 ? current : { ...current, height: 0 }));
        return;
      }
      setView({
        top: element.scrollTop,
        height: element.clientHeight,
        // the column the scrollbar reserves, which a parked heading has to
        // stop short of to line up with the rows it sits above
        gutter: element.offsetWidth - element.clientWidth,
      });
    };
    read();
    body.addEventListener("scroll", read, { capture: true, passive: true });
    const resize = new ResizeObserver(() => read());
    resize.observe(body);
    return () => {
      body.removeEventListener("scroll", read, { capture: true });
      resize.disconnect();
    };
  }, [items]);

  const goToGroup = (key: string) => {
    const body = bodyRef.current;
    const target = scrollTargetFor(groups, offsets, headingHeight, key);
    if (!body || target === null) {
      return;
    }
    const element = scrollerIn(body);
    if (!element) {
      return;
    }
    // scrolled by hand rather than by row index: the list can only put a row at
    // the very top, and the very top is where the parked headings are drawn.
    // Instantly, because the distance is thousands of rows and an animation
    // across it is a long wait for a view nobody watches on the way
    element.scrollTo({ top: target, behavior: "auto" });
    // said rather than waited for. The scroll event is what normally moves this,
    // but the heading that was just clicked has to stop being parked in the same
    // commit that moves the list — otherwise it stays against the edge, over the
    // group it has just travelled to, which reads as the group vanishing
    setView((current) => ({ ...current, top: target }));
  };

  const goToRow = (entityId: string) => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const element = scrollerIn(body);
    const offset = rowOffsetOf(items, entityId, headingHeight, rowHeight);
    if (!element || offset === null) {
      return;
    }
    const target = revealRowTarget(
      offset,
      rowHeight,
      view,
      parked.above.length * headingHeight,
      parked.below.length * headingHeight,
    );
    if (target === null) {
      return;
    }
    element.scrollTo({ top: target, behavior: "auto" });
    setView((current) => ({ ...current, top: target }));
  };

  return { bodyRef, parked, gutter: view.gutter, goToGroup, goToRow };
};
