import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledButton } from "./ButtonStyles";

interface ButtonProps {
  label?: string;
  icon?: JSX.Element;
  inverted?: boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  marginRight?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  inverted,
  color,
  onClick,
  marginRight,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      hasIcon={icon && true}
      hasMarginRight={marginRight}
      color={color ? color : "primary"}
      inverted={inverted}
    >
      {icon}
      {label}
    </StyledButton>
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
