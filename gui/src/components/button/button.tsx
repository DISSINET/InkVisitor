import React, { MouseEventHandler } from "react";
import classNames from "classnames";

import { Colors } from "components/types";

interface AppProps {
  label?: string;
  inverted?: Boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
}

export const Button: React.FC<AppProps> = ({
  label,
  inverted,
  color,
  onClick,
}) => {
  const classes = [
    "component",
    "button",
    "px-4",
    "py-2",
    "font-bold",
    "border-2",
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
