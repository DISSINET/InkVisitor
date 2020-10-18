import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "types";

interface ButtonProps {
  label?: string;
  inverted?: Boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  marginRight?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  inverted,
  color,
  onClick,
  marginRight,
}) => {
  const classes = [
    "component",
    "button",
    "px-3",
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
    <button onClick={onClick} className={classNames(classes)}>
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
