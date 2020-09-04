import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";

type Rotation = "top" | "bottom" | "right" | "left";

interface ArrowProps {
  color?: typeof Colors[number];
  rotation?: Rotation;
  onClick?: MouseEventHandler<HTMLElement>;
  size?: string;
}

export const Arrow: React.FC<ArrowProps> = ({
  color,
  rotation,
  size,
  onClick,
}) => {
  const classes = [
    "component",
    "arrow",
    "px-2",
    "py-1",
    "w-0",
    "h-0",
    `border-${color}`,
  ];

  const borderStyles = {
    borderBottomColor: rotation === "top" || "transparent",
    borderTopColor: rotation === "bottom" || "transparent",
    borderLeftColor: rotation === "right" || "transparent",
    borderRightColor: rotation === "left" || "transparent",

    marginTop: rotation === "top" && `-${size}`,
    marginBottom: rotation === "bottom" && `-${size}`,
    marginLeft: rotation === "left" && `-${size}`,
    marginRight: rotation === "right" && `-${size}`,

    borderWidth: size,
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
  color: "danger",
  rotation: "bottom",
  size: "1em",
};
