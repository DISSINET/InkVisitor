import React from "react";
import { Colors } from "types";
import { StyledIconFont } from "./IconFontStyles";

interface IconFont {
  letter: string;
  size?: number;
  color?: typeof Colors[number];
}
export const IconFont: React.FC<IconFont> = ({
  letter,
  size = 16,
  color = "greyer",
}) => {
  return (
    <StyledIconFont color={color} size={size}>
      {letter}
    </StyledIconFont>
  );
};
