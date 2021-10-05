import React from "react";

import {
  StyledAttributeModalRow,
  StyledAttributeModalRowLabel,
  StyledAttributeModalRowLabelIcon,
  StyledAttributeModalRowLabelText,
} from "../AttributesEditorStyles";
import { AttributeIcon, Checkbox } from "components";

interface CheckboxRow {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label: string;
  attributeName: string;
  disabled?: boolean;
}
export const CheckboxRow: React.FC<CheckboxRow> = ({
  value,
  onChangeFn,
  label,
  attributeName,
  disabled = false,
}) => {
  return (
    <StyledAttributeModalRow>
      <StyledAttributeModalRowLabel>
        <StyledAttributeModalRowLabelIcon>
          <AttributeIcon attributeName={attributeName} />
        </StyledAttributeModalRowLabelIcon>
        <StyledAttributeModalRowLabelText>
          {label}
        </StyledAttributeModalRowLabelText>
      </StyledAttributeModalRowLabel>
      <Checkbox
        disabled={disabled}
        onChangeFn={(newValue: boolean) => onChangeFn(newValue)}
        id={label}
        value={value}
      />
    </StyledAttributeModalRow>
  );
};
