import { useCallback, useEffect } from "react";

export default function useKeypress(
  targetKey: string,
  handleKeyPress: () => void,
  dependencyArr?: any[],
  ctrlKeyCombo?: boolean
) {
  const downHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== targetKey) return;
      const shouldHandleKeyPress =
        !ctrlKeyCombo || (ctrlKeyCombo && (e.ctrlKey || e.metaKey));
      if (!shouldHandleKeyPress) return;
      e.preventDefault();
      handleKeyPress();
    },
    [targetKey, handleKeyPress, ctrlKeyCombo, dependencyArr]
  );

  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [downHandler]);
}
