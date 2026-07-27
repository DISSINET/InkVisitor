import { useDebouncedCallback } from "hooks";
import { useCallback, useRef, useState, useLayoutEffect } from "react";

interface UseResizeObserverOptions {
  debounceDelay?: number;
}

interface Size {
  width: number | undefined;
  height: number | undefined;
}

export const useResizeObserver = <T extends HTMLElement>({
  debounceDelay = 0,
}: UseResizeObserverOptions = {}) => {
  // The observed element arrives through a callback ref rather than a ref
  // object, so a target that mounts later than the hook - or remounts under a
  // condition - still reaches the effect below.
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((element: T | null) => setNode(element), []);
  const animationFrameRef = useRef<number | null>(null);
  const [size, setSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });

  const debouncedCallback = useDebouncedCallback((newSize: Size) => {
    setSize((prevSize) => {
      if (prevSize.width === newSize.width && prevSize.height === newSize.height) {
        return prevSize; // No state update if size hasn't changed
      }
      return newSize;
    });
  }, debounceDelay);

  useLayoutEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || entries.length === 0) {
          return;
        }

        const entry = entries[0];
        const { width, height } = entry.contentRect;

        debouncedCallback({
          width: Math.round(width),
          height: Math.round(height),
        });
      });
    });

    resizeObserver.observe(node);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [node, debouncedCallback]);

  return { ref, ...size };
};
