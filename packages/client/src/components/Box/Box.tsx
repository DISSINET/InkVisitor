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
  label,
  color,
  width,
  height,
  children,
}) => {
  return (
    <StyledBox
      style={{ width: width, height: height ? height : "100%" }}
      color={color ? color : "primary"}
    >
      <Head color={color ? color : "primary"}>{label}</Head>
      <Content>{children}</Content>
    </StyledBox>
  );
};

Box.defaultProps = {
  label: "",
  color: "primary",
  width: 100,
  height: 200,
};
