import { config, useSpring } from "@react-spring/web";
import { InvertedBgColor } from "Theme/theme";
import { useTheme } from "hooks";
import React, { useState } from "react";
import { StyledIcon, StyledMenuItem } from "./MenuStyles";

interface MenuItem {
  label: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  color?: keyof InvertedBgColor;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
export const MenuItem: React.FC<MenuItem> = ({ label, icon, color, onClick }) => {
  const theme = useTheme();

  const [isHovered, setIsHovered] = useState(false);

  const hoverColor = color ? theme.color[color] : theme.color.black;
  const hoverBg = color ? theme.color.invertedBg[color] : theme.color.menuHover;

  const animatedBackground = useSpring({
    color: isHovered ? hoverColor : theme.color.black,
    backgroundColor: isHovered ? hoverBg : theme.color.white,
    config: config.stiff,
  });

  return (
    <StyledMenuItem
      style={animatedBackground}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onClick={onClick}
    >
      <StyledIcon>{icon || null}</StyledIcon>
      {label}
    </StyledMenuItem>
  );
};
