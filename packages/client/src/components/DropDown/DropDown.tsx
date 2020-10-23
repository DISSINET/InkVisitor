import React, { ReactNode } from "react";
import Select, {
  OptionsType,
  OptionTypeBase,
  GroupedOptionsType,
  ValueType,
  Theme,
} from "react-select";

interface DropDown {
  options?: OptionsType<OptionTypeBase> | GroupedOptionsType<OptionTypeBase>;
  value?: ValueType<OptionTypeBase>;
  onChange: (selectedOption: ValueType<OptionTypeBase>) => void;
  ref?: React.RefObject<ReactNode>;
}
export const DropDown: React.FC<DropDown> = ({ options, value, onChange }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      theme={(theme: Theme) => ({
        ...theme,
        borderRadius: 0,
        colors: {
          ...theme.colors,
          text: "white",
          primary25: "grey",
          primary50: "grey",
          primary: "black",
        },
      })}
    />
  );
};
