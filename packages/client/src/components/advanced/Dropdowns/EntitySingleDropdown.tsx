import { Dropdown } from "components";
import React from "react";

interface EntitySingleDropdown<T = string> {
  width?: number | "full";
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  onFocus: () => void;
  onBlur: () => void;
  autoFocus?: boolean;
  disabled?: boolean;

  loggerId?: string;
}
export const EntitySingleDropdown = <T extends string>({
  width,
  options,
  value,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
  disabled,

  loggerId,
}: EntitySingleDropdown<T>) => {
  return (
    <Dropdown
      entityDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      options={options}
      onChange={(value) => onChange(value[0].value as T)}
      onFocus={onFocus}
      onBlur={onBlur}
      disableTyping
      suggester
      disabled={disabled}
      autoFocus={autoFocus}
      loggerId={loggerId}
    />
  );
};
