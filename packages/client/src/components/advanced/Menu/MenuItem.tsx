import React, { useState } from "react";
import { config, useSpring } from "react-spring";
import theme from "Theme/theme";
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
  const [isHovered, setIsHovered] = useState(false);

  const animatedBackground = useSpring({
    color: isHovered ? theme.color["white"] : theme.color[color],
    backgroundColor: isHovered ? theme.color[color] : theme.color["white"],
    config: config.stiff,
  });

  return (
    <StyledMenuItem
      style={animatedBackground}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      color={color}
      onClick={onClick}
    >
      {icon || null}
      {label}
    </StyledMenuItem>
  );
};
