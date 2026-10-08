import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import React from "react";

interface BasicMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: string; info?: string }[];
  icon?: React.ReactNode;
  placeholder?: string;
  tooltipLabel?: string;
  disableTyping?: boolean;
  disabled?: boolean;
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
}: BasicMultiDropdown<T>) => {
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
      multi
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={options}
      value={options.filter((o) => value.includes(o.value as T))}
      onChange={(selected) => onChange(getValues(selected))}
      searchable={!disableTyping}
      disabled={disabled}
      closeMenuOnSelect={false}
      chipDensity="compact"
    />
  );
};
