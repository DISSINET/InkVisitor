import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { Dropdown } from "components";
import React from "react";

interface AttributeMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { label: string; value: T }[];
  icon?: JSX.Element;
  placeholder?: string;
  tooltipLabel?: string;
  disabled?: boolean;

  loggerId?: string;
}
export const AttributeMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  disabled,

  loggerId,
}: AttributeMultiDropdown<T>) => {
  return (
    <Dropdown
      // TODO: hopefully get rid of this prop
      attributeDropdown
      isMulti
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={[allEntities, ...options]}
      value={[{ label: allEntities.label, value: allEntities.value as T }]
        .concat(options)
        .filter((o) => value.includes(o.value))}
      onChange={(items) => onChange(items.map((i) => i.value as T))}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
