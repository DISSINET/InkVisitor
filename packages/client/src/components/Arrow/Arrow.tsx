import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";
import { StyledArrow } from "./ArrowStyles";

type Rotation = "top" | "bottom" | "right" | "left";

interface ArrowProps {
  color?: typeof Colors[number];
  rotation?: Rotation;
  onClick?: MouseEventHandler<HTMLElement>;
  size?: number;
  margin?: number;
}

export const Arrow: React.FC<ArrowProps> = ({
  color = "primary",
  rotation = "bottom",
  size = 13,
  margin = 5,
  onClick = () => {
    // do nothing
  },
}) => {
  return (
    <StyledArrow
      onClick={onClick}
      color={color}
      rotation={rotation}
      margin={margin}
      sizeValidated={size || 13}
      marginValidated={margin || 4}
      triangleMultiplier={1.5}
    ></StyledArrow>
  );
};
