import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";

interface HeaderProps {
  paddingX?: number;
  paddingY?: number;
  height?: number | "auto";
  left?: JSX.Element;
  right?: JSX.Element;
  color?: typeof Colors[number];
}

export const Header: React.FC<HeaderProps> = ({
  paddingX,
  paddingY,
  left,
  right,
  height,
  color,
}) => {
  const classesWrapper = [
    "component",
    "header",
    "px-10",
    "py-3",
    "w-full",
    `bg-${color}`,
    "text-white",
    "flex",
    "overflow-y-hidden",
  ];

  return (
    <div
      className={classNames(classesWrapper)}
      style={{
        height: height === "auto" ? "auto" : `${height}px`,
        padding: `${paddingY}px ${paddingX}px`,
      }}
    >
      <div className={classNames(["flex-1", "self-center", "text-left"])}>
        {left}
      </div>
      <div className={classNames(["flex-none", "self-center", "text-right"])}>
        {right}
      </div>
    </div>
  );
};

Header.defaultProps = {
  color: "primary",
  paddingY: 75,
  paddingX: 15,
  height: "auto",
  left: <div />,
  right: <div />,
};
