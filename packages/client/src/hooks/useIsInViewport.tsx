import { useCallback, useEffect, useState } from "react";

/**
 * Tracks whether the referenced element is intersecting the viewport.
 *
 * Returns a callback ref that re-attaches the observer whenever the node mounts
 * or unmounts, so it also works for elements that are conditionally rendered.
 *
 * `rootMargin` is a primitive so the effect deps stay stable across renders;
 * pass a positive margin (e.g. "200px") to start loading just before the
 * element scrolls into view.
 *
 * Usage: `const [ref, isInViewport] = useIsInViewport("200px");` then
 * `<div ref={ref} />`.
 */
export function useIsInViewport(rootMargin = "0px") {
  const [isInViewport, setIsInViewport] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const ref = useCallback((element: HTMLElement | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin]);

  return [ref, isInViewport] as const;
}

export default useIsInViewport;
