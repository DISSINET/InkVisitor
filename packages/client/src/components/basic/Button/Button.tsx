import { EntityEnums } from "@shared/enums";
import { Tooltip } from "components";
import React, { MouseEventHandler, ReactElement, useState } from "react";
import { Colors } from "types";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";

interface ButtonProps {
  tooltipLabel?: string;
  tooltipContent?: ReactElement[] | ReactElement;
  label?: string;
  icon?: JSX.Element | EntityEnums.Operator;
  noIconMargin?: boolean;
  noBackground?: boolean;
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
  tooltipLabel,
  tooltipContent,
  label = "",
  icon,
  noIconMargin = false,
  inverted = false,
  noBorder = false,
  noBackground = false,
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
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const renderButton = () => {
    return (
      <StyledButton
        ref={setReferenceElement}
        onClick={onClick}
        hasIcon={icon && true}
        color={color}
        inverted={inverted}
        textRegular={textRegular}
        noBorder={noBorder}
        noBackground={noBackground}
        radiusLeft={radiusLeft}
        radiusRight={radiusRight}
        fullWidth={fullWidth}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
        {label && (
          <StyledButtonLabel hasIcon={!!icon} noIconMargin={noIconMargin}>
            {label}
          </StyledButtonLabel>
        )}
      </StyledButton>
    );
  };
  return tooltipLabel || tooltipContent ? (
    <>
      <Tooltip
        label={tooltipLabel}
        content={tooltipContent}
        visible={showTooltip}
        referenceElement={referenceElement}
      />
      {renderButton()}
    </>
  ) : (
    renderButton()
  );
};
