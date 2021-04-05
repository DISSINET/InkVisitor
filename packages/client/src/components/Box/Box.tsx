import React, { ReactNode } from "react";

import { Colors } from "types";
import { StyledBox, StyledContent, StyledHead } from "./BoxStyles";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width: number;
  height?: number;
  noPadding?: boolean;
  children?: ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  label = "",
  color = "primary",
  width = 100,
  height = 200,
  noPadding = false,
  children,
}) => {
  return (
    <StyledBox color={color} width={width} height={height}>
      <StyledHead color={color}>{label}</StyledHead>
      <StyledContent noPadding={noPadding}>{children}</StyledContent>
    </StyledBox>
  );
};
