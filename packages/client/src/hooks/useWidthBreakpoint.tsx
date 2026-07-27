import { useLayoutEffect, useState } from "react";

/**
 * Tracks whether the element with the given id is narrower than a breakpoint.
 *
 * The observer fires on every frame of a panel resize, so only the boolean is
 * allowed to reach React: setting the same value back is a bail-out, which
 * leaves one render per crossing of the breakpoint rather than one per frame.
 */
export const useWidthBreakpoint = (breakpoint: number, elementId: string) => {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  useLayoutEffect(() => {
    const element = document.getElementById(elementId);
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) {
        setIsBelowBreakpoint(width < breakpoint);
      }
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [breakpoint, elementId]);

  return isBelowBreakpoint;
};
