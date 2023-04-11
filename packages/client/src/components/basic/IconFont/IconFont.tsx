import React from "react";
import { FaSquareFull } from "react-icons/fa";
import { StyledIconFont, StyledText } from "./IconFontStyles";

interface IconFont {
  letter: string;
  size?: number;
}
export const IconFont: React.FC<IconFont> = ({ letter, size = 16 }) => {
  return (
    <StyledIconFont>
      <FaSquareFull size={size} />
      <StyledText>{letter}</StyledText>
    </StyledIconFont>
  );
};
