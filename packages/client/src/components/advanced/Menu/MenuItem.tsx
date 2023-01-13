import React from "react";
import { Colors, IPage } from "types";
import { StyledMenuItem } from "./MenuStyles";

interface MenuItem {
  label: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  color?: typeof Colors[number];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
export const MenuItem: React.FC<MenuItem> = ({
  label,
  icon,
  color = "primary",
  onClick,
}) => {
  return (
    <StyledMenuItem color={color} onClick={onClick}>
      {icon || null}
      {label}
    </StyledMenuItem>
  );
};
