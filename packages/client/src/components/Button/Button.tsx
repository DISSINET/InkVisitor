import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledButton } from "./ButtonStyles";

interface ButtonProps {
  label?: string;
  icon?: JSX.Element;
  inverted?: boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  // TODO: remove after removing from containers
  marginRight?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label = "",
  icon,
  inverted = false,
  color = "primary",
  onClick = () => {
    // do nothing
  },
}) => {
  return (
    <StyledButton
      onClick={onClick}
      hasIcon={icon && true}
      color={color}
      inverted={inverted}
    >
      {icon}
      {label}
    </StyledButton>
  );
};
