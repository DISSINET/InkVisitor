import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown } from "components";
import React from "react";
import { DropdownItem } from "types";

interface AttributeMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: {
    value: T | EntityEnums.Extension.Any;
    label: string;
    info?: string;
  }[];
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
        console.log(selectedOptions);
        const allWithoutAnySelected = options.every((option) =>
          selectedOptions.includes(option)
        );
        // when something is selected = at least one option
        if (selectedOptions !== null && selectedOptions.length > 0) {
          // deselect ANY or remove button was clicked
          if (
            event?.action === "remove-value" ||
            (allWithoutAnySelected && event?.action === "deselect-option")
          ) {
            return onChange([]);
          }
          // when all option selected -> ANY is clicked
          else if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            return onChange(getValues([allEntities, ...options]));
          }
          // all are selected without ANY -> click on ANY is resolved earlier
          else if (allWithoutAnySelected && event?.action === "select-option") {
            return onChange(getValues([allEntities, ...options]));
          }
          // something was deselected from all selected (needed to deselect ANY)
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
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
