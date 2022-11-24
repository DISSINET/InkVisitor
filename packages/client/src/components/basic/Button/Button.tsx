import { EntityEnums } from "@shared/enums";
import { Tooltip, TooltipNew } from "components";
import React, { MouseEventHandler, useState } from "react";
import { Colors } from "types";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";

interface ButtonProps {
  tooltip?: string;
  label?: string;
  icon?: JSX.Element | EntityEnums.Operator;
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

export const Button: React.FC<
  ButtonProps & { innerRef?: React.MutableRefObject<HTMLButtonElement> }
> = ({
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
  innerRef,
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
        radiusLeft={radiusLeft}
        radiusRight={radiusRight}
        fullWidth={fullWidth}
        disabled={disabled}
        onMouseOver={() => setShowTooltip(true)}
        onMouseOut={() => setShowTooltip(false)}
      >
        {icon}
        {label && (
          <StyledButtonLabel hasIcon={!!icon}>{label}</StyledButtonLabel>
        )}
      </StyledButton>
    );
  };
  return tooltip ? (
    <>
      {renderButton()}
      <TooltipNew
        label={tooltip}
        visible={showTooltip}
        referenceElement={referenceElement}
      />
    </>
  ) : (
    renderButton()
  );
};
