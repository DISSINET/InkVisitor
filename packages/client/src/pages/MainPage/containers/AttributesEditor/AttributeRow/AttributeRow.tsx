import { allEntities } from "@shared/dictionaries/entity";
import { AttributeIcon, Dropdown } from "components";
import React, { useMemo } from "react";
import {
  StyledAttributeModalRow,
  StyledAttributeModalRowLabel,
  StyledAttributeModalRowLabelIcon,
  StyledAttributeModalRowLabelText,
} from "../AttributesEditorStyles";

interface AttributeRow {
  value: string | string[];
  items: { value: string; label: string }[];
  label: string;
  attributeName: string;
  multi?: boolean;
  onChangeFn: (value: string | string[]) => void;
  disabled?: boolean;
}
export const AttributeRow: React.FC<AttributeRow> = ({
  value,
  items,
  label,
  attributeName,
  multi = false,
  onChangeFn,
  disabled = false,
}) => {
  const selectedItem = useMemo(() => {
    return multi
      ? [allEntities].concat(items).filter((i: any) => value.includes(i.value))
      : items.find((i: any) => i.value === value);
  }, [value]);

  return (
    <StyledAttributeModalRow disabled={disabled}>
      <StyledAttributeModalRowLabel>
        <StyledAttributeModalRowLabelIcon>
          <AttributeIcon attributeName={attributeName} />
        </StyledAttributeModalRowLabelIcon>
        <StyledAttributeModalRowLabelText>
          {label}
        </StyledAttributeModalRowLabelText>
      </StyledAttributeModalRowLabel>
      <Dropdown
        width="full"
        isMulti={multi}
        disabled={disabled}
        options={items}
        value={selectedItem}
        onChange={(newValue: any) => {
          onChangeFn(
            multi
              ? newValue
                ? newValue.map((v: any) => v.value)
                : []
              : (newValue.value as string | string[])
          );
        }}
      />
    </StyledAttributeModalRow>
  );
};
