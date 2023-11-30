import { EntityEnums } from "@shared/enums";
import { ThemeColor } from "Theme/theme";
import { Tooltip } from "components";
import React, {
  KeyboardEvent,
  MouseEventHandler,
  ReactElement,
  useState,
} from "react";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";
import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";

interface ButtonProps {
  tooltipLabel?: string;
  tooltipContent?: ReactElement[] | ReactElement;
  label?: string;
  icon?: JSX.Element | EntityEnums.Operator;
  iconRight?: JSX.Element | EntityEnums.Operator;
  noIconMargin?: boolean;
  noBackground?: boolean;
  inverted?: boolean;
  noBorder?: boolean;
  textRegular?: boolean;
  radiusLeft?: boolean;
  radiusRight?: boolean;
  disabled?: boolean;
  color?: keyof ThemeColor;
  onClick?: MouseEventHandler<HTMLElement>;
  fullWidth?: boolean;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  hideTooltipOnClick?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  tooltipLabel,
  tooltipContent,
  label = "",
  icon,
  iconRight,
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
  tooltipPosition = "bottom",
  hideTooltipOnClick = false,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledButton
        ref={setReferenceElement}
        onClick={(e) => {
          e.stopPropagation();
          hideTooltipOnClick && setShowTooltip(false);
          onClick(e);
        }}
        hasIcon={icon && true}
        $color={color}
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
        onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) => e.preventDefault()}
      >
        {icon}
        {label && (
          <StyledButtonLabel hasIcon={!!icon} noIconMargin={noIconMargin}>
            {label}
          </StyledButtonLabel>
        )}
        {iconRight}
      </StyledButton>

      {(tooltipLabel || tooltipContent) && (
        <Tooltip
          label={tooltipLabel}
          content={tooltipContent}
          visible={showTooltip}
          referenceElement={referenceElement}
          position={tooltipPosition}
        />
      )}
    </>
  );
};
