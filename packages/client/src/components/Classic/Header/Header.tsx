import React from "react";
import { useAppSelector } from "redux/hooks";
import { Colors } from "types";
import { StyledHeader, TextLeft, TextRight } from "./HeaderStyles";

interface HeaderProps {
  paddingX?: number;
  paddingY?: number;
  height?: number;
  left?: JSX.Element;
  right?: JSX.Element;
  color?: typeof Colors[number];
}

export const Header: React.FC<HeaderProps> = ({
  paddingX,
  paddingY,
  left = <div />,
  right = <div />,
  height,
  color = "primary",
}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  return (
    <StyledHeader
      bgColor={color}
      height={height}
      paddingX={paddingX}
      paddingY={paddingY}
      layoutWidth={layoutWidth}
    >
      <TextLeft>{left}</TextLeft>
      <TextRight>{right}</TextRight>
    </StyledHeader>
  );
};
