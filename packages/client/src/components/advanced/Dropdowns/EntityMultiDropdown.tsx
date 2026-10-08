import { allEntities, empty } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { DropdownItem } from "@inkvisitor/shared/types";
import { IcoCheckboxChecked, IcoCheckboxUnchecked } from "Theme/icons";
import { BaseDropdown } from "components";
import React from "react";
import { EntityColors } from "types";
import {
  StyledEntityMultiValue,
  StyledEntityOptionClass,
  StyledEntityValue,
  StyledOptionIconWrap,
  StyledOptionRow,
} from "./DropdownStyles";
import { resolveEntityMultiChange } from "./selectAllLogic";

interface EntityMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: string; info?: string }[];
  placeholder?: string;
  noOptionsMessage?: string;
  disableEmpty?: boolean;
  disableTyping?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  limitSelectedItems?: number;
  closeMenuOnSelect?: boolean;
  shortLabel?: boolean;
}
export const EntityMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  placeholder,
  noOptionsMessage,
  disableEmpty = false,
  disableTyping = false,
  disabled,
  isClearable = true,
  limitSelectedItems,
  closeMenuOnSelect = true,
  shortLabel = false,
}: EntityMultiDropdown<T>) => {
  const generalValues: DropdownItem[] = disableEmpty
    ? [allEntities]
    : [empty, allEntities];

  const allOptionsSelected = options.every((option) =>
    value.includes(option.value as T)
  );

  // ANY is lit iff every real class is selected; other options by membership
  const selectedOptions = generalValues.concat(options).filter((o) => {
    if (o.value === allEntities.value) {
      return allOptionsSelected;
    }
    return value.includes(o.value as T);
  });

  /* chips exclude ANY; when exactly one chip would overflow the limit, show
     it instead of "+1 more" (pre-rewrite behavior) */
  const chipCount = selectedOptions.filter(
    (o) => o.value !== allEntities.value
  ).length;
  const overflow = limitSelectedItems
    ? chipCount - limitSelectedItems
    : 0;
  const effectiveChipLimit = limitSelectedItems
    ? overflow === 1
      ? limitSelectedItems + 1
      : limitSelectedItems
    : undefined;

  return (
    <BaseDropdown
      multi
      width={width}
      clearable={isClearable}
      options={[...generalValues, ...options]}
      value={selectedOptions}
      onChange={(selected, meta) =>
        onChange(
          resolveEntityMultiChange<T>({
            selected,
            action: meta.action,
            options,
            disableEmpty,
          })
        )
      }
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      searchable={!disableTyping}
      disabled={disabled}
      closeMenuOnSelect={closeMenuOnSelect}
      hiddenChipValues={[allEntities.value]}
      chipLimit={effectiveChipLimit}
      renderChip={(o) => (
        <StyledEntityMultiValue
          $color={EntityColors[o.value]?.color ?? "transparent"}
        >
          {shortLabel ? o.value : o.label}
        </StyledEntityMultiValue>
      )}
      renderOption={(o, { selected }) => {
        const isEntityClass = Object.values(EntityEnums.Class).includes(
          o.value as EntityEnums.Class
        );
        return (
          <StyledOptionRow>
            <StyledOptionIconWrap>
              {selected ? <IcoCheckboxChecked /> : <IcoCheckboxUnchecked />}
            </StyledOptionIconWrap>
            <StyledEntityOptionClass>
              {isEntityClass && o.value}
            </StyledEntityOptionClass>
            <StyledEntityValue
              color={
                o.value === EntityEnums.Extension.Empty
                  ? "transparent"
                  : (EntityColors[o.value]?.color ?? "transparent")
              }
            >
              {isEntityClass ? o.label : <i>{o.label}</i>}
            </StyledEntityValue>
          </StyledOptionRow>
        );
      }}
    />
  );
};
