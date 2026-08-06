import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";
import { BaseDropdown } from "components";
import React from "react";

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
  // adds the clear cross to the control; clearing reports an empty string
  isClearable?: boolean;

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
  tooltipPosition,
  disableTyping = false,
  disabled,
  onFocus,
  isClearable = false,
  loggerId,
  noDropDownIndicator = false,
}: BasicDropdown<T>) => {
  return (
    <BaseDropdown
      width={width}
      value={options.find((o) => o.value === value) ?? null}
      isClearable={isClearable}
      onChange={(value) => onChange((value[0]?.value ?? "") as T)}
      options={options}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      tooltipPosition={tooltipPosition}
      icon={icon}
      noDropDownIndicator={noDropDownIndicator}
      disableTyping={disableTyping}
      disabled={disabled}
      onFocus={onFocus}
      loggerId={loggerId}
    />
  );
};
