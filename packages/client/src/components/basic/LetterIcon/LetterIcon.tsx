import React from "react";
import { Colors } from "types";
import { StyledCircle } from "./LetterIconStyles";

interface LetterIcon {
  letter: string;
  color: typeof Colors[number];
}
export const LetterIcon: React.FC<LetterIcon> = ({
  letter = "X",
  color = "white",
}) => {
  return <StyledCircle color={color}>{letter}</StyledCircle>;
};
