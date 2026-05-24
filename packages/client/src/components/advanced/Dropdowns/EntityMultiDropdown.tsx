import { allEntities, empty } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { BaseDropdown } from "components";
import { StyledSelect } from "components/basic/BaseDropdown/BaseDropdownStyles";
import { useTheme } from "hooks";
import React from "react";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { components, MultiValueProps, OptionProps, ValueContainerProps } from "react-select";
import { EntityColors } from "types";
import {
  StyledEntityMultiValue,
  StyledEntityOptionClass,
  StyledEntityValue,
  StyledOptionIconWrap,
  StyledOptionRow,
} from "./DropdownStyles";
import { DropdownItem } from "@inkvisitor/shared/types";

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
      value={(() => {
        const allOptionsSelected = options.every((option) => value.includes(option.value as T));

        return generalValues.concat(options).filter((o) => {
          // For "any" option, check if all options are selected
          if (o.value === allEntities.value) {
            return allOptionsSelected;
          }
          // For other options, check if they're in the value array
          return value.includes(o.value as T);
        });
      })()}
      onChange={(selectedOptions, event) => {
        const allClassesSelected = options.every((option) => selectedOptions.includes(option));
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
          else if (selectedOptions[selectedOptions.length - 1].value === allEntities.value) {
            return onChange(
              getValues(
                includesEmpty ? [empty, allEntities, ...options] : [allEntities, ...options]
              )
            );
          }
          // all are selected without ANY -> highlight also ANY option (direct click on ANY is resolved earlier)
          else if (allClassesSelected && event?.action === "select-option") {
            return onChange(
              getValues(
                includesEmpty ? [empty, allEntities, ...options] : [allEntities, ...options]
              )
            );
          }
          // something was deselected from all selected (need to deselect ANY)
          else if (event?.action === "deselect-option" && includesAny && !allClassesSelected) {
            const result = selectedOptions.filter((option) => option.value !== allEntities.value);
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
    const remainingCount = limit ? filteredChildren.length - limit : 0;

    // If there's only 1 remaining, show it instead of "+1 more"
    // Only show "+X more" when there are 2 or more remaining
    const visibleChildren = limit
      ? filteredChildren.slice(0, remainingCount === 1 ? limit + 1 : limit)
      : filteredChildren;
    const displayRemainingCount = remainingCount > 1 ? remainingCount : 0;

    toBeRendered = [
      [
        ...visibleChildren,
        ...(displayRemainingCount > 0
          ? [
              <div
                key="ellipsis"
                style={{
                  padding: "0.2rem 0.2rem 0.2rem 0.3rem",
                  color: theme.color.primary,
                }}
              >
                +{displayRemainingCount} more
              </div>,
            ]
          : []),
      ],
      children[1],
    ];
  }

  return <components.ValueContainer {...props}>{toBeRendered}</components.ValueContainer>;
};

const MultiValue = (props: any): React.ReactElement => {
  const shortLabel = props.selectProps?.shortLabel;

  return (
    <components.MultiValue {...props}>
      <StyledEntityMultiValue $color={EntityColors[props.data.value]?.color ?? "transparent"}>
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
        <StyledEntityOptionClass>{isEntityClass && props.value}</StyledEntityOptionClass>
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
