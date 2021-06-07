import React, { ReactNode } from "react";
import { AnimatedValue } from "react-spring";

import { Colors } from "types";
import { StyledBox, StyledContent, StyledHead } from "./BoxStyles";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width?: number;
  animatedWidth?: any;
  height?: number;
  noPadding?: boolean;
  children?: ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  label = "",
  color = "primary",
  width = 100,
  animatedWidth,
  height = 200,
  noPadding = false,
  children,
}) => {
  return (
    <StyledBox
      color={color}
      width={width}
      style={animatedWidth}
      height={height}
    >
      <StyledHead color={color}>{label}</StyledHead>
      <StyledContent color={color} noPadding={noPadding}>
        {children}
      </StyledContent>
    </StyledBox>
  );
};
