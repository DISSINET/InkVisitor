import { useDebouncedCallback } from "hooks";
import { useLayoutEffect, useState } from "react";

interface ElementSize {
  width: number | undefined;
  height: number | undefined;
}

/**
 * Measures the element with the given id, for content that needs a pixel size
 * rather than a layout that can follow one - a canvas, say.
 *
 * The observer fires on every frame of a panel resize, so anything whose
 * response to a new size is expensive should pass a debounceDelay and settle a
 * beat after the drag instead of tracking it.
 */
export const useElementSize = (
  elementId: string,
  debounceDelay = 0,
): ElementSize => {
  const [size, setSize] = useState<ElementSize>({
    width: undefined,
    height: undefined,
  });

  const debouncedSetSize = useDebouncedCallback((newSize: ElementSize) => {
    setSize((prevSize) =>
      prevSize.width === newSize.width && prevSize.height === newSize.height
        ? prevSize
        : newSize,
    );
  }, debounceDelay);

  useLayoutEffect(() => {
    const element = document.getElementById(elementId);
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // Rounded down, never up: a box measured a pixel wider than it is hands
      // that pixel to whatever is sized from it, and a layout with no slack
      // left over then overflows and scrolls.
      debouncedSetSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [elementId, debouncedSetSize]);

  return size;
};
