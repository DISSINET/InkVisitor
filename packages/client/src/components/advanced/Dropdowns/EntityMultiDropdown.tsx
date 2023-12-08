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
        // kdyz je neco vybrany = aspon jeden option
        if (selectedOptions !== null && selectedOptions.length > 0) {
          if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            // kdyz vyberu all option (kliknuti na ANY)
            if (selectedOptions.includes(empty)) {
              return onChange(getValues([empty, allEntities, ...options]));
            } else {
              return onChange(getValues([allEntities, ...options]));
            }
          }
          let result: DropdownItem[] = [];
          // TODO: kdyz to obsahuje vsechny CLASS options, misto jsou vybrany vsechny
          // jsou vybrany vsechny
          if (options.every((option) => selectedOptions.includes(option))) {
            // kdyz jsou vybrany vsechny
            if (selectedOptions.includes(allEntities)) {
              //
              result = selectedOptions.filter(
                (option) => option.value !== allEntities.value
              );
            } else if (event?.action === "select-option") {
              result = options;
            }
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
