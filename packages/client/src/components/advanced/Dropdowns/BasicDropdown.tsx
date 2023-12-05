import { Dropdown } from "components";
import React from "react";

interface BasicDropdown<T = string> {
  // TODO: maybe could be generic enum value as well
  width?: number | "full";
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  icon?: JSX.Element;
  placeholder?: string;
  tooltipLabel?: string;
  disabled?: boolean;

  loggerId?: string;
}
export const BasicDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  disabled,

  loggerId,
}: BasicDropdown<T>) => {
  return (
    <Dropdown
      width={width}
      value={options.find((o) => o.value === value)}
      onChange={(value) => onChange(value[0].value as T)}
      options={options}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
