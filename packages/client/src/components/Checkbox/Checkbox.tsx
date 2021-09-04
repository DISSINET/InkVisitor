import React, { useEffect, useState } from "react";
import { StyledCheckbox } from "./CheckboxStyles";

interface Checkbox {
  value?: boolean;
  onChangeFn: Function;
  label?: string;
  id?: string;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn,
  label,
  id = "default",
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
      />
      <label htmlFor={id}>{label}</label>
    </>
  );
};
