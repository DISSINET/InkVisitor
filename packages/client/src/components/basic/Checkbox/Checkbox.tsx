import React, { useEffect, useState } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { Tooltip } from "components";
import {
  StyledCheckbox,
  StyledCheckboxWrapper,
  StyledLabel,
} from "./CheckboxStyles";

interface Checkbox {
  value: boolean;
  onChangeFn?: (value: boolean) => void;
  label?: string;
  size?: number;
  tooltipLabel?: string;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn = () => {},
  label,
  size = 18,
  tooltipLabel,
}) => {
  const [checked, setChecked] = useState(value);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  );
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    onChangeFn(checked);
  }, [checked]);

  return (
    <>
      <StyledCheckbox
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <StyledCheckboxWrapper style={{ cursor: "pointer" }}>
          {checked ? (
            <MdOutlineCheckBox
              size={size}
              onClick={(e) => {
                e.stopPropagation();
                setChecked(false);
              }}
            />
          ) : (
            <MdOutlineCheckBoxOutlineBlank
              size={size}
              onClick={(e) => {
                e.stopPropagation();
                setChecked(true);
              }}
            />
          )}
        </StyledCheckboxWrapper>
        <StyledLabel
          ref={setReferenceElement}
          onClick={() => setChecked(!checked)}
        >
          {label}
        </StyledLabel>
      </StyledCheckbox>

      {tooltipLabel && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
        />
      )}
    </>
  );
};
