import React, { ReactNode } from "react";
import {
  OptionsType,
  OptionTypeBase,
  GroupedOptionsType,
  ValueType,
} from "react-select";

import { StyledSelect } from "./DropdownStyles";

interface Dropdown {
  options?: OptionsType<OptionTypeBase> | GroupedOptionsType<OptionTypeBase>;
  value?: ValueType<OptionTypeBase>;
  onChange: (selectedOption: ValueType<OptionTypeBase>) => void;
  ref?: React.RefObject<ReactNode>;
  width?: number;
  menuWidth?: number;
  hideSelectedOptions?: boolean;
  noDropDownIndicator?: boolean;
  formatOptionLabel?: Function;
  isOptionSelected?: Function;
  getOptionLabel?: Function;
}
export const Dropdown: React.FC<Dropdown> = ({
  options,
  value,
  onChange,
  width,
  menuWidth,
  isOptionSelected,
  getOptionLabel,
  formatOptionLabel,
  hideSelectedOptions = false,
  noDropDownIndicator = false,
}) => {
  return (
    <StyledSelect
      className="react-select-container"
      classNamePrefix="react-select"
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
        menu: () => {
          return {
            width: menuWidth ? menuWidth : width,
            position: "absolute",
            top: "2em",
            zIndex: 100,
            backgroundColor: "white",
          };
        },
      }}
      onChange={onChange}
      options={options}
      width={width}
      hideSelectedOptions={hideSelectedOptions}
    />
  );
};
