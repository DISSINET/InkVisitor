import React, { useState } from "react";
import { FaCheck, FaMinus } from "react-icons/fa";
import { Tooltip } from "components";
import {
  StyledCheckbox,
  StyledCheckboxIndicator,
  StyledCheckboxWrapper,
  StyledIconOnlyCheckbox,
  StyledLabel,
} from "./CheckboxStyles";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";
import { ThemeColor } from "Theme/theme";

interface Checkbox {
  value: boolean;
  // partial-selection state (e.g. batch-select header): filled box with a dash
  indeterminate?: boolean;
  onChangeFn?: (value: boolean, event?: React.MouseEvent) => void;
  label?: string;
  icon?: React.ReactNode;
  size?: number;
  // paint the checked box as a plain (white) box with an accent-coloured border
  // and check instead of the default filled "info" look (see CheckboxStyles)
  accentColor?: keyof ThemeColor;
  tooltipLabel?: string;
  tooltipContent?: React.ReactNode;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  iconOnly?: boolean;
  // optional function to be called when the checkbox is clicked (onChangeFn is main function that returns value)
  onClickFn?: () => void;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  indeterminate = false,
  onChangeFn = () => {},
  label,
  icon,
  size = 15,
  accentColor,
  tooltipLabel,
  tooltipContent,
  iconOnly = false,
  tooltipPosition = "bottom",
  onClickFn = () => {},
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeFn(!value, e);
    onClickFn();
  };

  return (
    <>
      {iconOnly && (
        <StyledIconOnlyCheckbox
          ref={setReferenceElement}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          $checked={value}
          onClick={handleToggle}
        >
          {icon}
        </StyledIconOnlyCheckbox>
      )}
      {!iconOnly && (
        <StyledCheckbox
          ref={setReferenceElement}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <StyledCheckboxWrapper $hasLabel={!!label}>
            <StyledCheckboxIndicator
              $checked={value || indeterminate}
              $size={size}
              $accentColor={accentColor}
              onClick={handleToggle}
            >
              {indeterminate ? (
                <FaMinus size={size * 0.6} />
              ) : value ? (
                <FaCheck size={size * 0.6} />
              ) : null}
            </StyledCheckboxIndicator>
          </StyledCheckboxWrapper>
          {(label || icon) && (
            <StyledLabel onClick={handleToggle}>
              {label}
              {icon}
            </StyledLabel>
          )}
        </StyledCheckbox>
      )}

      {tooltipLabel && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
          content={<p>{tooltipContent}</p>}
          position={tooltipPosition}
        />
      )}
    </>
  );
};
