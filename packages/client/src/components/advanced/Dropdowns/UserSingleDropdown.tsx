import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import React from "react";
import { FaRegUser } from "react-icons/fa";
import {
  StyledUserOptionIconWrap,
  StyledUserOptionLabel,
  StyledUserOptionRow,
  StyledUserSingleValueRow,
} from "./DropdownStyles";

interface UserSingleDropdown {
  width?: number | "full";
  value: string | null;
  onChange: (value: string) => void;
  options: DropdownItem[];
  placeholder?: string;
  disableTyping?: boolean;
  disabled?: boolean;
}
export const UserSingleDropdown = ({
  width,
  value,
  onChange,
  options,
  placeholder,
  disableTyping = false,
  disabled,
}: UserSingleDropdown) => {
  return (
    <BaseDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      onChange={(selected) => onChange(selected[0].value)}
      options={options}
      placeholder={placeholder}
      searchable={!disableTyping}
      disabled={disabled}
      renderValue={(o) =>
        !o.value ? (
          o.label
        ) : (
          <StyledUserSingleValueRow>
            <StyledUserOptionIconWrap>
              <FaRegUser size={14} />
            </StyledUserOptionIconWrap>
            {o.label}
          </StyledUserSingleValueRow>
        )
      }
      renderOption={(o) => (
        <StyledUserOptionRow>
          <StyledUserOptionIconWrap>
            {!!o.value && <FaRegUser size={14} />}
          </StyledUserOptionIconWrap>
          <StyledUserOptionLabel>{o.label}</StyledUserOptionLabel>
        </StyledUserOptionRow>
      )}
    />
  );
};
