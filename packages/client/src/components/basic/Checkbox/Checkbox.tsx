import React, { useEffect, useState } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import theme from "Theme/theme";
import { StyledCheckboxWrapper, StyledLabel } from "./CheckboxStyles";

interface Checkbox {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label?: string;
  size?: number;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn,
  label,
  size = 18,
}) => {
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    onChangeFn(checked);
  }, [checked]);

  return (
    <StyledCheckboxWrapper>
      <span style={{ cursor: "pointer" }}>
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
      </span>
      <StyledLabel onClick={() => setChecked(!checked)}>{label}</StyledLabel>
    </StyledCheckboxWrapper>
  );
};
