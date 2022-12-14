import { useCallback, useEffect } from "react";

export default function useKeypress(
  targetKey: string,
  handleKeyPress: () => void,
  dependencyArr?: any[],
  ctrlKeyCombo?: boolean
) {
  const checkKeyPress = useCallback(() => {}, [dependencyArr]);

  function downHandler(e: any) {
    if (e.key === targetKey) {
      if (!ctrlKeyCombo || (ctrlKeyCombo && e.ctrlKey)) {
        handleKeyPress();
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [checkKeyPress]);
}
