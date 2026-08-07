import { BaseDropdown } from "components";
import React from "react";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";

interface BasicDropdown<T = string> {
  width?: number | "full";
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string; info?: string; isDisabled?: boolean }[];
  icon?: React.ReactNode;
  placeholder?: string;
  tooltipLabel?: string;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  disableTyping?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  noDropDownIndicator?: boolean;
}
export const BasicDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  tooltipPosition,
  disableTyping = false,
  disabled,
  onFocus,
  noDropDownIndicator = false,
}: BasicDropdown<T>) => {
  return (
    <BaseDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      onChange={(selected) => onChange(selected[0].value as T)}
      options={options}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      tooltipPosition={tooltipPosition}
      icon={icon}
      chevron={!noDropDownIndicator}
      searchable={!disableTyping}
      disabled={disabled}
      onFocus={onFocus}
    />
  );
};
