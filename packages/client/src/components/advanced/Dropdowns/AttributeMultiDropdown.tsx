import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown } from "components";
import React from "react";
import { DropdownItem } from "types";

interface AttributeMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { label: string; value: T | EntityEnums.Extension.Any }[];
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
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
      // TODO: hopefully get rid of this prop
      attributeDropdown
      isMulti
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={[allEntities, ...options]}
      value={[allEntities]
        .concat(options)
        .filter((o) => value.includes(o.value as T))}
      onChange={(selectedOptions, event) => {
        // kdyz je neco vybrany = aspon jeden option
        if (selectedOptions !== null && selectedOptions.length > 0) {
          if (event?.action === "remove-value") {
            return onChange([]);
          }
          if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            // kdyz vyberu all option
            return onChange(getValues(options));
          }
          let result: DropdownItem[] = [];
          // jsou vybrany vsechny
          if (selectedOptions.length === options.length) {
            // kdyz jsou vybrany vsechny
            if (selectedOptions.includes(allEntities)) {
              //
              result = selectedOptions.filter(
                (option: { label: string; value: string }) =>
                  option.value !== allEntities.value
              );
            } else if (event?.action === "select-option") {
              result = options;
            }
            return onChange(getValues(result));
          }
        }
        return onChange(getValues(selectedOptions));
      }}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
