import React, { ReactNode } from "react";

import { Colors } from "types";
import { StyledBox, Head, Content } from "./BoxStyles";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width: number;
  height?: number;
  children?: ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  label = "",
  color = "primary",
  width = 100,
  height = 200,
  children,
}) => {
  return (
    <StyledBox color={color} width={width} height={height}>
      <Head color={color}>{label}</Head>
      <Content>{children}</Content>
    </StyledBox>
  );
};
