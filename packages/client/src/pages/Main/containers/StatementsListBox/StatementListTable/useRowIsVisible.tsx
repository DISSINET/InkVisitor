import { useEffect, useState } from "react";

/**
 * Whether the row renders its cells. It turns true when the row enters the
 * statement list scroller and false only once the row is more than one scroller
 * height outside of it.
 *
 * The table lays out its column widths from the rendered rows only, so
 * rendering or dropping a row can change the table width, toggle the horizontal
 * scrollbar and change the scroller height by the scrollbar's thickness. The
 * gap between the two thresholds is far larger than that, so the change cannot
 * push the same row back across the threshold it just crossed.
 */
function useIsRowVisible(rowRef: React.RefObject<HTMLTableRowElement | null>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    // the scroller is the observer root, as rootMargin does not reach past the
    // clipping of a nested scroll container when observing against the viewport
    const root = row.closest("#Statements-box-table");

    const showObserver = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { root }
    );
    const hideObserver = new IntersectionObserver(
      ([entry]) => !entry.isIntersecting && setIsVisible(false),
      { root, rootMargin: "100% 0px" }
    );
    showObserver.observe(row);
    hideObserver.observe(row);

    return () => {
      showObserver.disconnect();
      hideObserver.disconnect();
    };
  }, [rowRef]);

  return isVisible;
}
export default useIsRowVisible;
