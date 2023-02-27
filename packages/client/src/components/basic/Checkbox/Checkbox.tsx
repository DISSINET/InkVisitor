import React, { useEffect, useState } from "react";
import {
  StyledCheckbox,
  StyledCheckboxWrapper,
  StyledLabel,
} from "./CheckboxStyles";

interface Checkbox {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn,
  label,
  id = "default",
  disabled = false,
}) => {
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    onChangeFn(checked);
  }, [checked]);

  return (
    <StyledCheckboxWrapper>
      <StyledCheckbox
        type="checkbox"
        id={id}
        checked={checked}
        onClick={(e: React.MouseEvent<HTMLInputElement, MouseEvent>) =>
          e.stopPropagation()
        }
        onChange={() => {
          setChecked(!checked);
        }}
        disabled={disabled}
      />
      <StyledLabel htmlFor={id}>{label}</StyledLabel>
    </StyledCheckboxWrapper>
  );
};
