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
      options
    );

    observer.observe(rowRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rowRef, options]);

  return isVisible;
}
export default useIsRowVisible;
