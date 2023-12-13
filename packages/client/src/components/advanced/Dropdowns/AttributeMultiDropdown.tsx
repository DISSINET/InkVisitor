import { allEntities } from "@shared/dictionaries/entity";
import { BaseDropdown } from "components";
import React from "react";
import { DropdownItem } from "types";

interface AttributeMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: {
    value: T;
    label: string;
    info?: string;
  }[];
  icon?: JSX.Element;
  placeholder?: string;
  tooltipLabel?: string;
  disableTyping?: boolean;
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
  disableTyping = false,
  disabled,

  loggerId,
}: AttributeMultiDropdown<T>) => {
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
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
        // all options selected independently of ANY
        const allWithoutAnySelected = options.every((option) =>
          selectedOptions.includes(option)
        );
        // when something is selected = at least one option
        if (selectedOptions !== null && selectedOptions.length > 0) {
          // deselect ANY or remove all button was clicked
          if (
            event?.action === "remove-value" ||
            (allWithoutAnySelected && event?.action === "deselect-option")
          ) {
            return onChange([]);
          }
          // when all option selected (ANY is clicked)
          else if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            return onChange(getValues([allEntities, ...options]));
          }
          // all are selected without ANY -> highlight also ANY option (direct click on ANY is resolved earlier)
          else if (allWithoutAnySelected && event?.action === "select-option") {
            return onChange(getValues([allEntities, ...options]));
          }
          // something was deselected from all selected (need to deselect ANY)
          else if (
            event?.action === "deselect-option" &&
            selectedOptions.includes(allEntities)
          ) {
            const result = selectedOptions.filter(
              (option) => option.value !== allEntities.value
            );
            return onChange(getValues(result));
          }
        }
        return onChange(getValues(selectedOptions));
      }}
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
