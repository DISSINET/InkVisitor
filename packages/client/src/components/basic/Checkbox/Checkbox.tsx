import React, { useEffect, useState } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import theme from "Theme/theme";
import { StyledCheckboxWrapper } from "./CheckboxStyles";

interface Checkbox {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label?: string;
  size?: number;
}
export const Checkbox: React.FC<Checkbox> = ({
  value,
  onChangeFn,
  size = 18,
}) => {
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    onChangeFn(checked);
  }, [checked]);

  return (
    <StyledCheckboxWrapper>
      {checked ? (
        <MdOutlineCheckBox
          size={size}
          color={theme.color.black}
          style={{ cursor: "pointer", zIndex: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            setChecked(false);
          }}
        />
      ) : (
        <MdOutlineCheckBoxOutlineBlank
          size={size}
          color={theme.color.black}
          style={{ cursor: "pointer", zIndex: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            setChecked(true);
          }}
        />
      )}
    </StyledCheckboxWrapper>
  );
};
