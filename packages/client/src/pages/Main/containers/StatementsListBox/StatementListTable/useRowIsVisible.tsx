import { useEffect, useState } from "react";

function useIsRowVisible(
  rowRef: React.RefObject<HTMLTableRowElement | null>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!rowRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        // Only trigger when at least 50% of the row is visible
        threshold: 0.5,
        // Add a 100px buffer zone
        rootMargin: "100px",
        ...options,
      }
    );

    observer.observe(rowRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rowRef, options]);

  return isVisible;
}
export default useIsRowVisible;
