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
  useKeypress(
    "Enter",
    () => {
      onEnter();
    },
    [dependencyArr],
    // ctrlKeyCombo
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
