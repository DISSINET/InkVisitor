import { allEntities, empty } from "@shared/dictionaries/entity";
import { BaseDropdown } from "components";
import React from "react";
import { DropdownItem } from "types";

interface EntityMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: string; info?: string }[];
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
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
      entityDropdown
      width={width}
      isMulti
      options={[empty, allEntities, ...options]}
      value={[empty, allEntities]
        .concat(options)
        .filter((o) => value.includes(o.value as T))}
      onChange={(selectedOptions, event) => {
        console.log(selectedOptions);
        const allClassesSelected = options.every((option) =>
          selectedOptions.includes(option)
        );
        // (possible to add && !disableEmpty for possibility to turn off empty)
        const includesEmpty = selectedOptions.includes(empty);
        const includesAny = selectedOptions.includes(allEntities);
        // kdyz je neco vybrany = aspon jeden option
        if (selectedOptions !== null && selectedOptions.length > 0) {
          if (allClassesSelected && event?.action === "deselect-option") {
            // empty was deselected
            if (includesAny) {
              return onChange(getValues(selectedOptions));
            }
            // ANY was deselected
            else {
              return onChange(includesEmpty ? [empty.value as T] : []);
            }
          }
          // kdyz vyberu all option (kliknuti na ANY)
          else if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            if (includesEmpty) {
              return onChange(getValues([empty, allEntities, ...options]));
            } else {
              return onChange(getValues([allEntities, ...options]));
            }
          }
          // all are selected without ANY -> highlight also ANY option (direct click on ANY is resolved earlier)
          else if (allClassesSelected && event?.action === "select-option") {
            return onChange(
              getValues(
                includesEmpty
                  ? [empty, allEntities, ...options]
                  : [allEntities, ...options]
              )
            );
          }
          // something was deselected from all selected (needed to deselect ANY)
          else if (
            event?.action === "deselect-option" &&
            includesAny &&
            !allClassesSelected
          ) {
            const result = selectedOptions.filter(
              (option) => option.value !== allEntities.value
            );
            return onChange(getValues(result));
          }
        }
        return onChange(getValues(selectedOptions));
      }}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      disabled={disabled}
      loggerId={loggerId}
    />
  );
};
