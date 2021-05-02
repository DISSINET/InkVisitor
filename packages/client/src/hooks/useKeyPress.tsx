import { useEffect } from "react";

interface useKeyPress {
  key: string;
  action: Function;
}
export const useKeyPress = ({ key, action }) => {
  useEffect(() => {
    function onKeyup(e) {
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, []);
};
