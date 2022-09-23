import React from "react";
import { Colors } from "types";
import { StyledCircle, StyledLetter } from "./LetterIconStyles";

interface LetterIcon {
  letter: string;
  color?: typeof Colors[number];
  size?: number;
}
export const LetterIcon: React.FC<LetterIcon> = ({
  letter = "X",
  color = "black",
  size = 16,
}) => {
  return (
    <StyledCircle color={color} size={size}>
      <StyledLetter size={size}>{letter}</StyledLetter>
    </StyledCircle>
  );
};
