import React, { useCallback, useEffect } from "react";
import useKeypress from "hooks/useKeyPress";

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
  useKeypress(
    "Enter",
    () => {
      onEnter();
    },
    [dependencyArr],
    true
  );

  useKeypress(
    "Escape",
    () => {
      onEscape();
    },
    [dependencyArr]
  );
  return <></>;
};
