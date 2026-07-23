import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { ThemeColor } from "Theme/theme";
import { Tooltip } from "components";
import React, { KeyboardEvent, MouseEventHandler, ReactElement, useState } from "react";
import { ButtonShape, ButtonSize } from "types";
import { useButtonDefaults } from "./ButtonDefaults";
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
  /** Renders the label at bold weight, e.g. to mark the selected option of a group. */
  bold?: boolean;
  disabled?: boolean;
  /** Keeps the default cursor for buttons that react to hover rather than to a click. */
  noPointer?: boolean;
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
  /** Portal root for the tooltip, for buttons rendered outside #page-content. */
  tooltipPortalId?: string;
  hideTooltipOnClick?: boolean;
  dataTestId?: string;
  noPadding?: boolean;
  shape?: ButtonShape;
}

export const Button: React.FC<ButtonProps> = ({
  size: sizeProp,
  shape: shapeProp,
  tooltipLabel,
  tooltipContent,
  label = "",
  icon,
  iconRight,
  noIconMargin = false,
  inverted = false,
  noBorder = false,
  noBackground = false,
  textRegular = true,
  bold = false,
  disabled = false,
  noPointer = false,
  color = "primary",
  textColor,
  borderColor,
  onClick = () => {
    // do nothing
  },
  fullWidth = false,
  fullHeight = false,
  tooltipPosition = "bottom",
  tooltipPortalId,
  hideTooltipOnClick = false,
  dataTestId,
  noPadding = false,
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const hasLabel = label.length > 0;
  const defaults = useButtonDefaults();
  const size = sizeProp ?? (hasLabel ? defaults.size : undefined) ?? ButtonSize.Small;
  const shape = shapeProp ?? (hasLabel ? defaults.shape : undefined) ?? "rounded-sm";

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
        $hasLabel={hasLabel}
        $color={color}
        $textColor={textColor}
        $borderColor={borderColor}
        $inverted={inverted}
        $textRegular={textRegular}
        $bold={bold}
        $noBorder={noBorder}
        $noBackground={noBackground}
        $fullWidth={fullWidth}
        $fullHeight={fullHeight}
        $disabled={disabled}
        $noPointer={noPointer}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) => e.preventDefault()}
        data-testid={dataTestId}
        $noPadding={noPadding}
        $shape={shape}
      >
        {icon}
        {label && (
          <StyledButtonLabel $hasIcon={!!icon} $noIconMargin={noIconMargin} data-label={label}>
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
          portalId={tooltipPortalId}
        />
      )}
    </>
  );
};
