import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<number | undefined>(undefined);
  // The returned function keeps one identity for the lifetime of the component,
  // so callers can list it in an effect's dependencies without rebuilding that
  // effect every render. The latest callback reaches the timer through the ref.
  const callbackRef = useRef<T>(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // a timer left running past unmount fires into a component that is gone
  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return debouncedCallback as T;
};

export default useDebouncedCallback;
