import { InvertedBgColor } from "Theme/theme";
import React from "react";
import { StyledIcon, StyledMenuItem, StyledMenuItemLabel } from "./MenuStyles";

interface MenuItem {
  label: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  color?: keyof InvertedBgColor;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
export const MenuItem: React.FC<MenuItem> = ({ label, icon, color, onClick }) => {
  return (
    <StyledMenuItem $color={color} onClick={onClick}>
      <StyledIcon>{icon || null}</StyledIcon>
      <StyledMenuItemLabel>{label}</StyledMenuItemLabel>
    </StyledMenuItem>
  );
};
