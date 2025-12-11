import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";
import { EntityEnums } from "@shared/enums";
import { ThemeColor } from "Theme/theme";
import { Tooltip } from "components";
import React, {
  KeyboardEvent,
  MouseEventHandler,
  ReactElement,
  useRef,
  useState,
} from "react";
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
  onClick?: MouseEventHandler<HTMLElement>;
  fullWidth?: boolean;
  // to control the height from parent
  fullHeight?: boolean;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  hideTooltipOnClick?: boolean;
  dataTestId?: string;
  noPadding?: boolean;
  circular?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  size = ButtonSize.Small,
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
  fullHeight = false,
  tooltipPosition = "bottom",
  hideTooltipOnClick = false,
  dataTestId,
  noPadding = false,
  circular = false,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const handledRef = useRef(false);

  // Prevent input blur when clicking buttons (in case of suggester list)
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && !handledRef.current) {
      handledRef.current = true;
      e.stopPropagation();
      hideTooltipOnClick && setShowTooltip(false);
      onClick(e);
      setShowTooltip(false);
      // Reset the flag after a short delay to allow for normal clicks
      setTimeout(() => {
        handledRef.current = false;
      }, 0);
    }
  };

  return (
    <>
      <StyledButton
        ref={setReferenceElement}
        onMouseDown={(e) => {
          // Prevent input blur when clicking buttons
          // Handle click on mousedown to avoid blur interference
          if (!disabled && e.button === 0) {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent<HTMLElement>);
          }
        }}
        onClick={(e) => {
          handleClick(e);
        }}
        $size={size}
        $iconButton={icon !== undefined && label?.length === 0}
        $color={color}
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
        $circular={circular}
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
