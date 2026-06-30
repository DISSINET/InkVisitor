import { RefObject, useEffect, useState } from "react";

/**
 * Tracks whether the referenced element is intersecting the viewport.
 * `rootMargin` is a primitive so the effect deps stay stable across renders;
 * pass a positive margin (e.g. "200px") to start loading just before the
 * element scrolls into view.
 */
export function useIsInViewport(
  ref: RefObject<HTMLElement | null>,
  rootMargin = "0px"
) {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isInViewport;
}

export default useIsInViewport;
