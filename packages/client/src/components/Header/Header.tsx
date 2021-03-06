import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledHeader, TextLeft, TextRight } from "./HeaderStyles";

interface HeaderProps {
  paddingX?: number;
  paddingY?: number;
  height?: number | "auto";
  left?: JSX.Element;
  right?: JSX.Element;
  color?: typeof Colors[number];
}

export const Header: React.FC<HeaderProps> = ({
  paddingX,
  paddingY,
  left = <div />,
  right = <div />,
  height = "auto",
  color = "primary",
}) => {
  return (
    <StyledHeader
      bgColor={color}
      height={height}
      paddingX={paddingX}
      paddingY={paddingY}
    >
      <TextLeft>{left}</TextLeft>
      <TextRight>{right}</TextRight>
    </StyledHeader>
  );
};
