import { allEntities, empty } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown } from "components";
import React from "react";
import { EntityDropdownItem } from "types";

interface EntityMultiDropdown {
  width?: number | "full";
  value: EntityEnums.Class[];
  onChange: (value: EntityEnums.Class[]) => void;
  options: EntityDropdownItem[];
  placeholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;

  loggerId?: string;
}
export const EntityMultiDropdown: React.FC<EntityMultiDropdown> = ({
  width,
  value,
  onChange,
  options,
  placeholder,
  noOptionsMessage,
  disabled,

  loggerId,
}) => {
  return (
    <BaseDropdown
      entityDropdown
      width={width}
      isMulti
      options={[empty, allEntities, ...options]}
      value={[empty, allEntities]
        .concat(options)
        .filter((o) => value.includes(o.value as EntityEnums.Class))}
      onChange={(items) =>
        onChange(items.map((i) => i.value as EntityEnums.Class))
      }
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
