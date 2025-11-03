import { allEntities, empty } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown } from "components";
import { StyledSelect } from "components/basic/BaseDropdown/BaseDropdownStyles";
import { useTheme } from "hooks";
import React from "react";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import {
  components,
  MultiValueProps,
  OptionProps,
  ValueContainerProps,
} from "react-select";
import { DropdownItem, EntityColors } from "types";
import {
  StyledEntityMultiValue,
  StyledEntityOptionClass,
  StyledEntityValue,
  StyledOptionIconWrap,
  StyledOptionRow,
} from "./DropdownStyles";

interface EntityMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: string; info?: string }[];
  placeholder?: string;
  noOptionsMessage?: string;

  disableAny?: boolean;
  disableEmpty?: boolean;
  disableTyping?: boolean;
  disabled?: boolean;

  isClearable?: boolean;
  limitSelectedItems?: number;

  loggerId?: string;
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

  disableAny = false,
  disableEmpty = false,
  disableTyping = false,
  disabled,

  isClearable = true,
  limitSelectedItems,

  loggerId,
  closeMenuOnSelect = true,
  shortLabel = false,
}: EntityMultiDropdown<T>) => {
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  const generalValues = [];
  if (!disableEmpty) {
    generalValues.push(empty);
  }
  if (!disableAny) {
    generalValues.push(allEntities);
  }

  return (
    <BaseDropdown
      entityDropdown
      width={width}
      isMulti
      isClearable={isClearable}
      options={[...generalValues, ...options]}
      value={generalValues
        .concat(options)
        .filter((o) => value.includes(o.value as T))}
      onChange={(selectedOptions, event) => {
        const allClassesSelected = options.every((option) =>
          selectedOptions.includes(option)
        );
        // (possible to add && !disableEmpty for possibility to turn off empty)
        const includesEmpty = selectedOptions.includes(empty);
        const includesAny = selectedOptions.includes(allEntities);

        // when something is selected = at least one option
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
          // when all option selected (ANY is clicked)
          else if (
            selectedOptions[selectedOptions.length - 1].value ===
            allEntities.value
          ) {
            return onChange(
              getValues(
                includesEmpty
                  ? [empty, allEntities, ...options]
                  : [allEntities, ...options]
              )
            );
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
          // something was deselected from all selected (need to deselect ANY)
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
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
      customComponents={{
        Option,
        MultiValue: MultiValue as typeof components.MultiValue,
        ValueContainer,
      }}
      limitSelectedItems={limitSelectedItems}
      closeMenuOnSelect={closeMenuOnSelect}
      shortLabel={shortLabel}
    />
  );
};

const ValueContainer = ({
  children,
  ...props
}: { children: any } & ValueContainerProps<any, any, any> & {
    selectProps: StyledSelect;
  }): React.ReactElement => {
  const theme = useTheme();

  const currentValues: DropdownItem[] = [...props.getValue()];
  let toBeRendered = children;

  if (currentValues.length > 0) {
    // filter ANY out of the values array
    const filteredChildren = children[0].filter(
      (ch: any) => ch.key !== `${allEntities.label}-${allEntities.value}`
    );

    const limit = props.selectProps.limitSelectedItems;
    // Show limited number of entities and add ellipsis if there are more
    const visibleChildren = limit
      ? filteredChildren.slice(0, limit)
      : filteredChildren;
    const remainingCount = limit ? filteredChildren.length - limit : 0;

    toBeRendered = [
      [
        ...visibleChildren,
        ...(remainingCount > 0
          ? [
              <div
                key="ellipsis"
                style={{
                  padding: "0.2rem 0.2rem 0.2rem 0.3rem",
                  color: theme.color.primary,
                }}
              >
                +{remainingCount} more
              </div>,
            ]
          : []),
      ],
      children[1],
    ];
  }

  return (
    <components.ValueContainer {...props}>
      {toBeRendered}
    </components.ValueContainer>
  );
};

const MultiValue = (props: any): React.ReactElement => {
  const shortLabel = props.selectProps?.shortLabel;

  return (
    <components.MultiValue {...props}>
      <StyledEntityMultiValue
        $color={EntityColors[props.data.value]?.color ?? "transparent"}
      >
        {shortLabel ? props.data.value : props.data.label}
      </StyledEntityMultiValue>
    </components.MultiValue>
  );
};

const Option = ({ ...props }: OptionProps | any): React.ReactElement => {
  const isEntityClass = Object.values(EntityEnums.Class).includes(props.value);
  return (
    <components.Option {...props}>
      <StyledOptionRow>
        <StyledOptionIconWrap>
          {props.isSelected ? <FaCheckSquare /> : <FaRegSquare />}
        </StyledOptionIconWrap>
        <StyledEntityOptionClass>
          {isEntityClass && props.value}
        </StyledEntityOptionClass>
        <StyledEntityValue
          color={
            props.value === EntityEnums.Extension.Empty
              ? "transparent"
              : EntityColors[props.value]?.color ?? "transparent"
          }
        >
          {isEntityClass ? props.label : <i>{props.label}</i>}
        </StyledEntityValue>
      </StyledOptionRow>
    </components.Option>
  );
};
