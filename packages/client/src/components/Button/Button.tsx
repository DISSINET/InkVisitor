import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledButton } from "./ButtonStyles";

import { Tooltip } from "components";

interface ButtonProps {
  tooltip?: string;
  label?: string;
  icon?: JSX.Element;
  inverted?: boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
}

export const Button: React.FC<ButtonProps> = ({
  tooltip = "",
  label = "",
  icon,
  inverted = false,
  color = "primary",
  onClick = () => {
    // do nothing
  },
}) => {
  const renderButton = () => {
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
  return tooltip ? (
    <Tooltip label={tooltip}>{renderButton()}</Tooltip>
  ) : (
    renderButton()
  );
};
