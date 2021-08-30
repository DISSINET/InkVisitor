import React, { useMemo } from "react";
import {
  StyledAttributeModalRow,
  StyledAttributeModalRowLabel,
  StyledAttributeModalRowLabelIcon,
  StyledAttributeModalRowLabelText,
} from "../StatementEditorAttributesStyles";
import { Dropdown } from "components";

interface AttributeRow {
  value: string | string[];
  items: { value: string; label: string }[];
  label: string;
  icon: React.ReactElement;
  multi: boolean;
  onChangeFn: (value: string | string[]) => void;
}
export const AttributeRow: React.FC<AttributeRow> = ({
  value,
  items,
  label,
  icon,
  multi,
  onChangeFn,
}) => {
  const selectedItem = useMemo(() => {
    return multi
      ? items.filter((i: any) => value.includes(i.value))
      : items.find((i: any) => i.value === value);
  }, [value]);

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
      <Dropdown
        width="full"
        isMulti={multi}
        options={items}
        value={selectedItem}
        onChange={(newValue: any) => {
          onChangeFn(
            multi
              ? newValue.map((v: any) => v.value)
              : (newValue.value as string | string[])
          );
        }}
      />
    </StyledAttributeModalRow>
  );
};
