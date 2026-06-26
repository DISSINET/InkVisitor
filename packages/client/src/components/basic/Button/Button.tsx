import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { ThemeColor } from "Theme/theme";
import { Tooltip } from "components";
import React, { KeyboardEvent, MouseEventHandler, ReactElement, useState } from "react";
import { ButtonSize } from "types";
import { StyledButton, StyledButtonLabel } from "./ButtonStyles";

interface ButtonProps {
  size?: ButtonSize;
  tooltipLabel?: string;
  tooltipContent?: ReactElement[] | ReactElement;
  label?: string;
  icon?: React.ReactNode | EntityEnums.Operator;
  iconRight?: React.ReactNode | EntityEnums.Operator;
  noIconMargin?: boolean;
  noBackground?: boolean;
  inverted?: boolean;
  noBorder?: boolean;
  textRegular?: boolean;
  radiusLeft?: boolean;
  radiusRight?: boolean;
  disabled?: boolean;
  color?: keyof ThemeColor;
  /** Overrides only the text/icon color, leaving background and border to other props. */
  textColor?: keyof ThemeColor;
  /** Overrides only the border color, leaving text and background to other props. */
  borderColor?: keyof ThemeColor;
  onClick?: MouseEventHandler<HTMLElement>;
  fullWidth?: boolean;
  // to control the height from parent
  fullHeight?: boolean;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  hideTooltipOnClick?: boolean;
  dataTestId?: string;
  noPadding?: boolean;
  shape?: "square" | "circle" | "rounded-sm" | "rounded-md" | "rounded-lg" | "rounded-full";
}

export const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Small,
  shape = "rounded-sm",
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
  textColor,
  borderColor,
  onClick = () => {
    // do nothing
  },
  fullWidth = false,
  fullHeight = false,
  tooltipPosition = "bottom",
  hideTooltipOnClick = false,
  dataTestId,
  noPadding = false,
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledButton
        ref={setReferenceElement}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            hideTooltipOnClick && setShowTooltip(false);
            onClick(e);
            setShowTooltip(false);
          }
        }}
        $size={size}
        $iconButton={icon !== undefined && label?.length === 0}
        $color={color}
        $textColor={textColor}
        $borderColor={borderColor}
        $inverted={inverted}
        $textRegular={textRegular}
        $noBorder={noBorder}
        $noBackground={noBackground}
        $radiusLeft={radiusLeft}
        $radiusRight={radiusRight}
        $fullWidth={fullWidth}
        $fullHeight={fullHeight}
        $disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) => e.preventDefault()}
        data-testid={dataTestId}
        $noPadding={noPadding}
        $shape={shape}
      >
        {icon}
        {label && (
          <StyledButtonLabel $hasIcon={!!icon} $noIconMargin={noIconMargin}>
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
