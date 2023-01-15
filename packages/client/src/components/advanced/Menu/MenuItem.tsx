import React, { useState } from "react";
import { config, useSpring } from "react-spring";
import theme, { ThemeColor } from "Theme/theme";
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
  const [isHovered, setIsHovered] = useState(false);

  const selectedColor: any = theme.color[color];

  const animatedBackground = useSpring({
    color: isHovered ? theme.color["white"] : selectedColor,
    backgroundColor: isHovered ? selectedColor : theme.color["white"],
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
