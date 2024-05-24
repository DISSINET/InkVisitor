import { heightHeader } from "Theme/constants";
import { ThemeColor } from "Theme/theme";
import React from "react";
import { useAppSelector } from "redux/hooks";
import { StyledHeader, TextLeft, TextRight } from "./HeaderStyles";

interface HeaderProps {
  paddingX?: number;
  paddingY?: number;
  height?: number;
  left?: JSX.Element;
  right?: JSX.Element;
  color?: keyof ThemeColor;
}

export const Header: React.FC<HeaderProps> = ({
  paddingX,
  paddingY,
  left = <div />,
  right = <div />,
  height = heightHeader,
  color = "primary",
}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  return (
    <StyledHeader
      $color={color}
      $height={height}
      $paddingX={paddingX}
      $paddingY={paddingY}
      $layoutWidth={layoutWidth}
    >
      <TextLeft>{left}</TextLeft>
      <TextRight>{right}</TextRight>
    </StyledHeader>
  );
};
