import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";

interface ButtonProps {
  label?: string;
  icon?: JSX.Element;
  inverted?: Boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  marginRight?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  inverted,
  color,
  onClick,
  marginRight,
}) => {
  const classes = [
    "component",
    "button",
    icon ? "px-1" : "px-2",
    "py-1",
    "font-bold",
    "border-2",
    "text-xs",
    marginRight && "mr-1",
  ];
  if (inverted) {
    classes.push("bg-white");
    classes.push(`text-${color}`);
    classes.push(`border-${color}`);
  } else {
    classes.push(`bg-${color}`);
    classes.push("text-white");
    classes.push(`border-${color}`);
  }
  return (
    <button
      style={{ fontSize: "11px" }}
      onClick={onClick}
      className={classNames(classes)}
    >
      {icon}
      {label}
    </button>
  );
};

Button.defaultProps = {
  onClick: () => {
    // do nothing
  },
  color: "primary",
  inverted: false,
  label: "",
};
