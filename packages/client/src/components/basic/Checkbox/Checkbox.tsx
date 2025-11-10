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
  icon?: React.ReactNode;
  size?: number;
  tooltipLabel?: string;
  tooltipContent?: React.ReactNode;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn = () => {},
  label,
  icon,
  size = 18,
  tooltipLabel,
  tooltipContent,
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
        {(label || icon) && (
          <StyledLabel
            ref={setReferenceElement}
            onClick={() => setChecked(!checked)}
          >
            {label}
            {icon}
          </StyledLabel>
        )}
      </StyledCheckbox>

      {tooltipLabel && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
          content={<p>{tooltipContent}</p>}
        />
      )}
    </>
  );
};
