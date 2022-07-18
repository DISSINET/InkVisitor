import { Operator } from "@shared/enums";
import { Tooltip } from "components";
import React, { MouseEventHandler } from "react";
import { Colors } from "types";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";

interface ButtonProps {
  tooltip?: string;
  label?: string;
  icon?: JSX.Element | Operator;
  inverted?: boolean;
  noBorder?: boolean;
  textRegular?: boolean;
  radiusLeft?: boolean;
  radiusRight?: boolean;
  disabled?: boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  tooltip,
  label = "",
  icon,
  inverted = false,
  noBorder = false,
  radiusLeft = false,
  radiusRight = false,
  textRegular = false,
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
        textRegular={textRegular}
        noBorder={noBorder}
        radiusLeft={radiusLeft}
        radiusRight={radiusRight}
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
