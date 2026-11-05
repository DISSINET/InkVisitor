import { allEntities } from "@inkvisitor/shared/dictionaries/entity";
import { BaseDropdown } from "components";
import React from "react";
import { resolveAttributeMultiChange } from "./selectAllLogic";

interface AttributeMultiDropdown<T = string> {
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
export const AttributeMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  disableTyping = false,
  disabled,
}: AttributeMultiDropdown<T>) => {
  const selectedOptions = [allEntities, ...options].filter((o) =>
    value.includes(o.value as T)
  );

  return (
    <BaseDropdown
      multi
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={[allEntities, ...options]}
      value={selectedOptions}
      onChange={(selected, meta) =>
        onChange(
          resolveAttributeMultiChange<T>({
            selected,
            action: meta.action,
            options,
          })
        )
      }
      searchable={!disableTyping}
      disabled={disabled}
      chipSummary={(count, total) =>
        // ANY is part of both counts; when everything incl. ANY is selected,
        // report the number of real options only
        `${count === total ? count - 1 : count} selected`
      }
    />
  );
};
