import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import React from "react";

interface BasicMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: {
    value: T;
    label: string;
    info?: string;
  }[];
  icon?: React.ReactNode;
  placeholder?: string;
  tooltipLabel?: string;
  disableTyping?: boolean;
  disabled?: boolean;

  loggerId?: string;
}
export const BasicMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  disableTyping = false,
  disabled,

  loggerId,
}: BasicMultiDropdown<T>) => {
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
      isMulti
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={options}
      value={options.filter((o) => value.includes(o.value as T))}
      onChange={(selectedOptions) => onChange(getValues(selectedOptions))}
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
      closeMenuOnSelect={false}
      compactChips
    />
  );
};
