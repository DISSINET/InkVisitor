import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";

import { Tooltip } from "components";

interface ButtonProps {
  tooltip?: string;
  label?: string;
  icon?: JSX.Element;
  inverted?: boolean;
  disabled?: boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  tooltip = "",
  label = "",
  icon,
  inverted = false,
  disabled = false,
  color = "primary",
  onClick = () => {
    // do nothing
  },
  fullWidth = false,
}) => {
  const renderButton = () => {
    return (
      <StyledButton
        onClick={onClick}
        hasIcon={icon && true}
        color={color}
        inverted={inverted}
        fullWidth={fullWidth}
        disabled={disabled}
      >
        {icon}
        {label && (
          <StyledButtonLabel hasIcon={!!icon}>{label}</StyledButtonLabel>
        )}
      </StyledButton>
    );
  };
  return tooltip ? (
    <Tooltip label={tooltip}>{renderButton()}</Tooltip>
  ) : (
    renderButton()
  );
};
