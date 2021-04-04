import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledArrow } from "./ArrowStyles";

type Rotation = "top" | "bottom" | "right" | "left";

interface ArrowProps {
  color?: typeof Colors[number];
  rotation?: Rotation;
  onClick?: MouseEventHandler<HTMLElement>;
  size?: number;
}

export const Arrow: React.FC<ArrowProps> = ({
  color = "primary",
  rotation = "bottom",
  size = 13,
  onClick = () => {
    // do nothing
  },
}) => {
  return (
    <StyledArrow
      onClick={onClick}
      color={color}
      rotation={rotation}
      sizeValidated={size}
      triangleMultiplier={1.5}
    ></StyledArrow>
  );
};
