import { ThemeColor } from "Theme/theme";
import React from "react";
import { StyledCircle, StyledLetter } from "./LetterIconStyles";

interface LetterIcon {
  letter: string;
  color?: keyof ThemeColor;
  bgColor?: keyof ThemeColor;
  size?: number;
}
export const LetterIcon: React.FC<LetterIcon> = ({
  letter = "X",
  color = "black",
  bgColor,
  size = 16,
}) => {
  return (
    <div>
      <StyledCircle $color={color} size={size} bgColor={bgColor}>
        <StyledLetter size={size} $color={color}>
          {letter}
        </StyledLetter>
      </StyledCircle>
    </div>
  );
};
