import { DropdownItem } from "@inkvisitor/shared/types";
import { IcoCheckboxChecked, IcoCheckboxUnchecked } from "Theme/icons";
import { BaseDropdown } from "components";
import React from "react";
import { FaRegUser } from "react-icons/fa";
import {
  StyledOptionIconWrap,
  StyledUserMultiValue,
  StyledUserMultiValueIcon,
  StyledUserMultiValueLabel,
  StyledUserOptionIconWrap,
  StyledUserOptionLabel,
  StyledUserOptionRow,
} from "./DropdownStyles";

interface UserMultiDropdown {
  width?: number | "full";
  value: string[];
  onChange: (value: string[]) => void;
  options: DropdownItem[];
  placeholder?: string;
  noOptionsMessage?: string;
  disableTyping?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  limitSelectedItems?: number;
  closeMenuOnSelect?: boolean;
}
export const UserMultiDropdown = ({
  width,
  value,
  onChange,
  options,
  placeholder,
  noOptionsMessage,
  disableTyping = false,
  disabled,
  isClearable = true,
  limitSelectedItems,
  closeMenuOnSelect = false,
}: UserMultiDropdown) => {
  return (
    <BaseDropdown
      multi
      width={width}
      clearable={isClearable}
      options={options}
      value={options.filter((o) => value.includes(o.value))}
      onChange={(selected) => onChange(selected.map((o) => o.value))}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      searchable={!disableTyping}
      disabled={disabled}
      closeMenuOnSelect={closeMenuOnSelect}
      chipDensity="compact"
      chipLimit={limitSelectedItems}
      renderChip={(o) => (
        <StyledUserMultiValue>
          <StyledUserMultiValueIcon>
            <FaRegUser size={12} />
          </StyledUserMultiValueIcon>
          <StyledUserMultiValueLabel>{o.label}</StyledUserMultiValueLabel>
        </StyledUserMultiValue>
      )}
      renderOption={(o, { selected }) => (
        <StyledUserOptionRow>
          <StyledOptionIconWrap>
            {selected ? <IcoCheckboxChecked /> : <IcoCheckboxUnchecked />}
          </StyledOptionIconWrap>
          <StyledUserOptionIconWrap>
            <FaRegUser size={14} />
          </StyledUserOptionIconWrap>
          <StyledUserOptionLabel>{o.label}</StyledUserOptionLabel>
        </StyledUserOptionRow>
      )}
    />
  );
};
