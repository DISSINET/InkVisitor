import { config, useSpring } from "@react-spring/web";
import theme, { ThemeColor } from "Theme/theme";
import React, { useContext, useState } from "react";
import { ThemeContext } from "styled-components";
import { StyledMenuItem } from "./MenuStyles";

interface MenuItem {
  label: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  color?: keyof ThemeColor;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
export const MenuItem: React.FC<MenuItem> = ({
  label,
  icon,
  color = "primary",
  onClick,
}) => {
  const themeContext = useContext(ThemeContext);

  const [isHovered, setIsHovered] = useState(false);

  const selectedColor = themeContext.color[color];

  const animatedBackground = useSpring({
    color: isHovered ? themeContext.color["white"] : selectedColor,
    backgroundColor: isHovered ? selectedColor : themeContext.color["white"],
    config: config.stiff,
  });

  return (
    <StyledMenuItem
      style={animatedBackground}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onClick={onClick}
    >
      {icon || null}
      {label}
    </StyledMenuItem>
  );
};
