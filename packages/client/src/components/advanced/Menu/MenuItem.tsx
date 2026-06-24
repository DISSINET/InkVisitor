import { config, useSpring } from "@react-spring/web";
import { ThemeColor } from "Theme/theme";
import { useTheme } from "hooks";
import React, { useState } from "react";
import { StyledIcon, StyledMenuItem } from "./MenuStyles";

interface MenuItem {
  label: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  color?: keyof ThemeColor;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
export const MenuItem: React.FC<MenuItem> = ({ label, icon, color = "primary", onClick }) => {
  const theme = useTheme();

  const [isHovered, setIsHovered] = useState(false);

  const selectedColor = theme.color[color] as string;

  const hoverBg =
    color === "danger" ? theme.color.invertedBg.danger : theme.color.invertedBg.info;

  const animatedBackground = useSpring({
    color: isHovered ? selectedColor : (theme.color.black as string),
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
