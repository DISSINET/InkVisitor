import React from "react";

import {
  StyledAttributeModalRow,
  StyledAttributeModalRowLabel,
  StyledAttributeModalRowLabelIcon,
  StyledAttributeModalRowLabelText,
} from "../StatementEditorAttributesStyles";
import { Checkbox } from "components";

interface CheckboxRow {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label: string;
  icon: React.ReactElement;
}
export const CheckboxRow: React.FC<CheckboxRow> = ({
  value,
  onChangeFn,
  icon,
  label,
}) => {
  return (
    <StyledAttributeModalRow>
      <StyledAttributeModalRowLabel>
        <StyledAttributeModalRowLabelIcon>
          {icon}
        </StyledAttributeModalRowLabelIcon>
        <StyledAttributeModalRowLabelText>
          {label}
        </StyledAttributeModalRowLabelText>
      </StyledAttributeModalRowLabel>
      <Checkbox
        onChangeFn={(newValue: boolean) => onChangeFn(newValue)}
        id={label}
        value={value}
      />
    </StyledAttributeModalRow>
  );
};
