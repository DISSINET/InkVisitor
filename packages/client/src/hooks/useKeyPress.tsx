import { useCallback, useEffect } from "react";

//TODO: make this hook more intuitive to read and use. Now it's very difficult to see the key combos.
export default function useKeypress(
  targetKey: string,
  handleKeyPress: () => void,
  dependencyArr?: any[],
  ctrlKeyCombo?: boolean,
  /** When true: only handle with Shift. When false: only handle without Shift. Omit: don't check. */
  requireShift?: boolean
) {
  const downHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== targetKey) return;
      // If ctrlKeyCombo is true, only handle with ctrlKey or metaKey
      const shouldHandleKeyPress =
        !ctrlKeyCombo || (ctrlKeyCombo && (e.ctrlKey || e.metaKey));
      // If requireShift is true, only handle with shiftKey
      if (!shouldHandleKeyPress) return;
      if (requireShift !== undefined && e.shiftKey !== requireShift) return;
      e.preventDefault();
      handleKeyPress();
    },
    [targetKey, handleKeyPress, ctrlKeyCombo, requireShift, dependencyArr]
  );

  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [downHandler]);
}
