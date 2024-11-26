import { BaseDropdown } from "components";
import React from "react";

interface BasicDropdown<T = string> {
  width?: number | "full";
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string; info?: string; isDisabled?: boolean }[];
  icon?: JSX.Element;
  placeholder?: string;
  tooltipLabel?: string;
  disableTyping?: boolean;
  disabled?: boolean;

  noDropDownIndicator?: boolean;
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
  disableTyping = false,
  disabled,
  loggerId,
  noDropDownIndicator = false,
}: BasicDropdown<T>) => {
  return (
    <BaseDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      onChange={(value) => onChange(value[0].value as T)}
      options={options}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      noDropDownIndicator={noDropDownIndicator}
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
