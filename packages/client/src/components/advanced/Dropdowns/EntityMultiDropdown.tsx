import { allEntities, empty } from "@shared/dictionaries/entity";
import { Dropdown } from "components";
import React from "react";

interface EntityMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { label: string; value: T }[];
  placeholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;

  loggerId?: string;
}
export const EntityMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  placeholder,
  noOptionsMessage,
  disabled,

  loggerId,
}: EntityMultiDropdown<T>) => {
  return (
    <Dropdown
      entityDropdown
      width={width}
      isMulti
      options={[empty, allEntities, ...options]}
      value={[
        { label: empty.label, value: empty.value as T },
        { label: allEntities.label, value: allEntities.value as T },
      ]
        .concat(options)
        .filter((o) => value.includes(o.value))}
      onChange={(items) => onChange(items.map((i) => i.value as T))}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
