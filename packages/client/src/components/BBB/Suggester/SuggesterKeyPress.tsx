import useKeypress from "hooks/useKeyPress";
import React from "react";

interface SuggesterKeyPress {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  dependencyArr?: any[];
}
export const SuggesterKeyPress: React.FC<SuggesterKeyPress> = ({
  onArrowUp = () => {},
  onArrowDown = () => {},
  dependencyArr,
}) => {
  useKeypress(
    "ArrowUp",
    () => {
      onArrowUp();
    },
    [dependencyArr]
  );
  useKeypress(
    "ArrowDown",
    () => {
      onArrowDown();
    },
    [dependencyArr]
  );
  return <div></div>;
};
