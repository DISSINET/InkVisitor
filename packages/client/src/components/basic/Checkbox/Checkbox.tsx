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
import { FlatThemeColor } from "Theme/theme";

interface Checkbox {
  value: boolean;
  // partial-selection state (e.g. batch-select header): filled box with a dash
  indeterminate?: boolean;
  onChangeFn?: (value: boolean, event?: React.MouseEvent) => void;
  label?: string;
  icon?: React.ReactNode;
  size?: number;
  // accent colour for the checked border and checkmark (defaults to "info")
  color?: FlatThemeColor;
  // when true the checked box stays a plain (white) box with a coloured check
  // instead of the default fill (see CheckboxStyles)
  noFill?: boolean;
  tooltipLabel?: string;
  tooltipContent?: React.ReactNode;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  iconOnly?: boolean;
  // optional function to be called when the checkbox is clicked (onChangeFn is main function that returns value)
  onClickFn?: () => void;
  disableEnterKey?: boolean;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  indeterminate = false,
  onChangeFn = () => {},
  label,
  icon,
  size = 14,
  color = "info",
  noFill = false,
  tooltipLabel,
  tooltipContent,
  iconOnly = false,
  tooltipPosition = "bottom",
  onClickFn = () => {},
  disableEnterKey = false,
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    // a click with detail 0 is raised by keyboard activation rather than a
    // pointer, so a box that hands Enter to the page must let it pass
    if (disableEnterKey && e.detail === 0) {
      return;
    }
    e.stopPropagation();
    onChangeFn(!value, e);
    onClickFn();
  };

  // Space/Enter toggle the box when it holds keyboard focus, matching native
  // checkbox behaviour (the indicator is a styled span, not an <input>).
  const handleKeyToggle = (e: React.KeyboardEvent) => {
    // the box keeps focus while Enter belongs to the page (e.g. the query page
    // runs the search): preventDefault drops any activation click the browser
    // would raise from the key, and the event still bubbles to page handlers
    if (disableEnterKey && e.key === "Enter") {
      e.preventDefault();
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onChangeFn(!value);
      onClickFn();
      return;
    }
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
          <StyledCheckboxWrapper>
            <StyledCheckboxIndicator
              role="checkbox"
              tabIndex={0}
              aria-checked={indeterminate ? "mixed" : value}
              aria-label={label}
              $checked={value || indeterminate}
              $size={size}
              $color={color}
              $noFill={noFill}
              onClick={handleToggle}
              onKeyDown={handleKeyToggle}
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
