import React, { ReactNode } from "react";
import classNames from "classnames";

import { Colors } from "types";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width: number;
  height: number;
  children?: ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  label,
  color,
  width,
  height,
  children,
}) => {
  const boxClasses = classNames(`border-${color}`, "border-2");

  const headClasses = classNames(
    "box-head",
    `bg-${color}`,
    "text-white",
    "font-bold",
    "p-2"
  );
  const contentClasses = classNames(
    "box-content",
    "bg-white",
    "p-2",
    "overflow-auto",
    "h-full"
  );

  return (
    <div className={boxClasses} style={{ width: width, height: height }}>
      <div className={headClasses}>{label}</div>
      <div className={contentClasses}>{children}</div>
    </div>
  );
};

Box.defaultProps = {
  label: "",
  color: "primary",
  width: 100,
  height: 200,
};
