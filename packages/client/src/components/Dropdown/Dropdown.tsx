import React, { ReactNode } from "react";
import {
  GroupedOptionsType,
  OptionsType,
  OptionTypeBase,
  ValueType,
} from "react-select";
import { DropdownItem } from "types";
import { StyledSelect, StyledSelectWrapper } from "./DropdownStyles";

const allOption = {
  label: "Select all",
  value: "*",
};

interface Dropdown {
  options?: OptionsType<OptionTypeBase> | GroupedOptionsType<OptionTypeBase>;
  value?: ValueType<OptionTypeBase, any>;
  onChange: (selectedOption: ValueType<OptionTypeBase, any>) => void;
  components?: any;
  ref?: React.RefObject<ReactNode>;
  width?: number | "full";
  disabled?: boolean;
  hideSelectedOptions?: boolean;
  noDropDownIndicator?: boolean;
  formatOptionLabel?: Function;
  isOptionSelected?: Function;
  getOptionLabel?: Function;
  placeholder?: string;
  noOptionsMessage?: Function;
  isClearable?: boolean;
  isMulti?: boolean;
  allowSelectAll?: boolean;
}
export const Dropdown: React.FC<Dropdown> = ({
  options = [],
  value,
  onChange,
  components = undefined,
  width,
  isOptionSelected,
  getOptionLabel,
  formatOptionLabel,
  hideSelectedOptions = false,
  noDropDownIndicator = false,
  placeholder = "select..",
  noOptionsMessage = () => "no option selected",
  isClearable = false,
  isMulti = false,
  disabled = false,
  allowSelectAll = false,
}) => {
  return (
    <StyledSelectWrapper width={width}>
      <StyledSelect
        isMulti={isMulti}
        isDisabled={disabled}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder={placeholder}
        noOptionsMessage={noOptionsMessage}
        isClearable={isClearable}
        components={{ components }}
        {...(getOptionLabel ? { getOptionLabel: getOptionLabel } : {})}
        {...(formatOptionLabel ? { formatOptionLabel: formatOptionLabel } : {})}
        {...(isOptionSelected ? { isOptionSelected: isOptionSelected } : {})}
        value={value}
        styles={{
          dropdownIndicator: () => {
            return {
              display: noDropDownIndicator ? "none" : "",
            };
          },
        }}
        onChange={onChange}
        options={
          allowSelectAll ? [allOption, ...options[Symbol.iterator]()] : options
        }
        width={width}
        hideSelectedOptions={hideSelectedOptions}
      />
    </StyledSelectWrapper>
  );
};
