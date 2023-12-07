import { dropdownWildCard } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown } from "components";
import React from "react";
import { EntityDropdownItem } from "types";

interface EntitySingleDropdown {
  width?: number | "full";
  options: EntityDropdownItem[];
  value: EntityEnums.Class | EntityEnums.Extension.Any;
  placeholder?: string;
  onChange: (value: EntityEnums.Class | EntityEnums.Extension.Any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  suggester?: boolean;
  disableTyping?: boolean;
  disabled?: boolean;

  loggerId?: string;
}
export const EntitySingleDropdown: React.FC<EntitySingleDropdown> = ({
  width,
  options,
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
  suggester,
  disableTyping,
  disabled,

  loggerId,
}) => {
  return (
    <BaseDropdown
      entityDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      options={options}
      onChange={(value) => onChange(value[0].value as EntityEnums.Class)}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      suggester={suggester}
      disableTyping={disableTyping}
      disabled={disabled}
      autoFocus={autoFocus}
      loggerId={loggerId}
    />
  );
};
