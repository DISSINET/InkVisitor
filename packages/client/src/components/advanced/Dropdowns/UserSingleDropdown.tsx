import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import React from "react";
import { FaRegUser } from "react-icons/fa";
import { components, OptionProps, SingleValueProps } from "react-select";
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
  loggerId?: string;
}
export const UserSingleDropdown = ({
  width,
  value,
  onChange,
  options,
  placeholder,
  disableTyping = false,
  disabled,
  loggerId,
}: UserSingleDropdown) => {
  return (
    <BaseDropdown
      userDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      onChange={(selected) => onChange(selected[0].value)}
      options={options}
      placeholder={placeholder}
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
      customComponents={{
        Option,
        SingleValue: SingleValue as typeof components.SingleValue,
      }}
    />
  );
};

const SingleValue = (props: SingleValueProps<DropdownItem>): React.ReactElement => {
  const isAny = !props.data.value;

  return (
    <components.SingleValue {...props}>
      {isAny ? (
        props.data.label
      ) : (
        <StyledUserSingleValueRow>
          <StyledUserOptionIconWrap>
            <FaRegUser size={14} />
          </StyledUserOptionIconWrap>
          {props.data.label}
        </StyledUserSingleValueRow>
      )}
    </components.SingleValue>
  );
};

const Option = ({ ...props }: OptionProps | any): React.ReactElement => {
  const isAny = !props.data.value;

  return (
    <components.Option {...props}>
      <StyledUserOptionRow>
        <StyledUserOptionIconWrap>
          {!isAny && <FaRegUser size={14} />}
        </StyledUserOptionIconWrap>
        <StyledUserOptionLabel>{props.label}</StyledUserOptionLabel>
      </StyledUserOptionRow>
    </components.Option>
  );
};
