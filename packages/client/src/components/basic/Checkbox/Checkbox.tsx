import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { Tooltip } from "components";
import {
  StyledCheckbox,
  StyledCheckboxIndicator,
  StyledCheckboxWrapper,
  StyledIconOnlyCheckbox,
  StyledLabel,
} from "./CheckboxStyles";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";

interface Checkbox {
  value: boolean;
  onChangeFn?: (value: boolean) => void;
  label?: string;
  icon?: React.ReactNode;
  size?: number;
  tooltipLabel?: string;
  tooltipContent?: React.ReactNode;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  iconOnly?: boolean;
  // optional function to be called when the checkbox is clicked (onChangeFn is main function that returns value)
  onClickFn?: () => void;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn = () => {},
  label,
  icon,
  size = 18,
  tooltipLabel,
  tooltipContent,
  iconOnly = false,
  tooltipPosition = "bottom",
  onClickFn = () => {},
}) => {
  const [checked, setChecked] = useState(value);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    onChangeFn(checked);
  }, [checked]);

  return (
    <>
      {iconOnly && (
        <StyledIconOnlyCheckbox
          ref={setReferenceElement}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          $checked={checked}
          onClick={(e) => {
            e.stopPropagation();
            setChecked(!checked);
            onClickFn();
          }}
        >
          {icon}
        </StyledIconOnlyCheckbox>
      )}
      {!iconOnly && (
        <StyledCheckbox
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <StyledCheckboxWrapper $hasLabel={!!label}>
            <StyledCheckboxIndicator
              $checked={checked}
              $size={size}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setChecked(!checked);
              }}
            >
              {checked && <FaCheck size={size * 0.6} />}
            </StyledCheckboxIndicator>
          </StyledCheckboxWrapper>
          {(label || icon) && (
            <StyledLabel ref={setReferenceElement} onClick={() => setChecked(!checked)}>
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
