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
}
export const Dropdown: React.FC<Dropdown> = ({
  options,
  value,
  onChange,
  width,
}) => {
  return (
    <StyledSelect
      className="react-select-container"
      classNamePrefix="react-select"
      value={value}
      onChange={onChange}
      options={options}
      width={width}
    />
  );
};
