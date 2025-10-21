import useKeypress from "hooks/useKeyPress";
import React, { useEffect, useState } from "react";

interface ModalKeyPress {
  onEnter?: () => void;
  onEscape?: () => void;
  dependencyArr?: any[];
}
export const ModalKeyPress: React.FC<ModalKeyPress> = ({
  onEnter = () => {},
  onEscape = () => {},
  dependencyArr,
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay key handler activation to prevent capturing the same keypress that opened the modal
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useKeypress(
    "Enter",
    () => {
      if (isReady) {
        onEnter();
      }
    },
    [dependencyArr, isReady],
    true
  );

  useKeypress(
    "Escape",
    () => {
      if (isReady) {
        onEscape();
      }
    },
    [dependencyArr, isReady]
  );
  return <></>;
};
