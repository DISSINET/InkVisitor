import { ThemeColor } from "Theme/theme";
import React from "react";
import { StyledCircle, StyledLetter } from "./LetterIconStyles";

interface LetterIcon {
  letter: string;
  color?: keyof ThemeColor;
  bgColor?: keyof ThemeColor;
  /** defaults to the letter colour */
  borderColor?: keyof ThemeColor;
  size?: number;
}
export const LetterIcon: React.FC<LetterIcon> = ({
  letter = "X",
  color = "black",
  bgColor,
  borderColor,
  size = 16,
}) => {
  return (
    <StyledCircle
      $color={borderColor ?? color}
      size={size}
      bgColor={bgColor}
    >
      <StyledLetter size={size} $color={color}>
        {letter}
      </StyledLetter>
    </StyledCircle>
  );
};
