import React, { useEffect, useState } from "react";
import { StyledCheckbox } from "./CheckboxStyles";

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
    <>
      <StyledCheckbox
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => {
          setChecked(!checked);
        }}
        disabled={disabled}
      />
      <label htmlFor={id}>{label}</label>
    </>
  );
};
