import { useEffect } from "react";

export default function useKeyLift(
  targetKey: string,
  handleKeyLift: () => void
) {
  function upHandler(e: any) {
    if (e.key === targetKey) {
      handleKeyLift();
    }
  }

  useEffect(() => {
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keyup", upHandler);
    };
  }, []);
}
