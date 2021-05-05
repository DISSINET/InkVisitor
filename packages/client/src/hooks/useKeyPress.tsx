import { useCallback, useEffect } from "react";

export default function useKeypress(
  targetKey: string,
  handleKeyPress: () => void,
  dependencyArr?: any[]
) {
  const checkKeyPress = useCallback(() => {}, [dependencyArr]);

  function downHandler({ key }: any) {
    if (key === targetKey) {
      handleKeyPress();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [checkKeyPress]);
}
