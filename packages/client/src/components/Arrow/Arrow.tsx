import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";

type Rotation = "top" | "bottom" | "right" | "left";

interface ArrowProps {
  color?: typeof Colors[number];
  rotation?: Rotation;
  onClick?: MouseEventHandler<HTMLElement>;
  size?: number;
  margin?: number;
}

export const Arrow: React.FC<ArrowProps> = ({
  color,
  rotation,
  size,
  margin,
  onClick,
}) => {
  const classes = ["component", "arrow", "w-0", "h-0", `border-${color}`];

  const sizeValidated = size || 13;
  const marginValidated = margin || 4;
  const sizeMinusMargin = sizeValidated + marginValidated;
  const triangleMultiplier = 1.5;

  const borderStyles: React.CSSProperties = {
    borderBottomColor: rotation === "top" ? "" : "transparent",
    borderTopColor: rotation === "bottom" ? "" : "transparent",
    borderLeftColor: rotation === "right" ? "" : "transparent",
    borderRightColor: rotation === "left" ? "" : "transparent",

    marginTop:
      rotation === "top" ? `-${sizeValidated * triangleMultiplier}px` : 0,
    marginBottom:
      rotation === "bottom" ? `-${sizeValidated * triangleMultiplier}px` : 0,
    marginLeft:
      rotation === "left"
        ? `-${sizeValidated * triangleMultiplier - marginValidated}px`
        : margin,
    marginRight:
      rotation === "right"
        ? `-${sizeValidated * triangleMultiplier - marginValidated}px`
        : margin,

    borderWidth:
      rotation === "top" || rotation === "bottom"
        ? `${sizeValidated * triangleMultiplier}px ${sizeValidated}px`
        : `${sizeValidated}px ${sizeValidated * triangleMultiplier}px`,
  };

  return (
    <div
      style={borderStyles}
      onClick={onClick}
      className={classNames(classes)}
    ></div>
  );
};

Arrow.defaultProps = {
  onClick: () => {
    // do nothing
  },
  color: "primary",
  rotation: "bottom",
  size: 13,
  margin: 5,
};
