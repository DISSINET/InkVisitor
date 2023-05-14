import React from "react";
import { Colors } from "types";
import { StyledCircle, StyledLetter } from "./LetterIconStyles";

interface LetterIcon {
  letter: string;
  color?: (typeof Colors)[number];
  bgColor?: (typeof Colors)[number];
  size?: number;
}
export const LetterIcon: React.FC<LetterIcon> = ({
  letter = "X",
  color = "black",
  bgColor = "white",
  size = 16,
}) => {
  return (
    <div>
      <StyledCircle color={color} size={size} bgColor={bgColor}>
        <StyledLetter size={size} color={color}>
          {letter}
        </StyledLetter>
      </StyledCircle>
    </div>
  );
};
