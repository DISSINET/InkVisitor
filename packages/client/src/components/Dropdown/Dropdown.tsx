import { allEntities } from "@shared/dictionaries/entity";
import { ActantType } from "@shared/enums";
import { IOption } from "@shared/types";
import React, { ReactNode, Ref, useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { RiArrowDownSLine } from "react-icons/ri";
import {
  GroupedOptionsType,
  OptionsType,
  OptionTypeBase,
  ValueType,
  components,
  MultiValueProps,
  ValueContainerProps,
  SingleValueProps,
  IndicatorProps,
} from "react-select";
import { CommonProps, OptionProps } from "react-select/src/types";
import { DropdownAny, DropdownItem, Entities } from "types";
import {
  StyledEntityValue,
  StyledFaChevronDown,
  StyledSelect,
  StyledSelectWrapper,
} from "./DropdownStyles";

interface Dropdown {
  options?: OptionsType<OptionTypeBase> | GroupedOptionsType<OptionTypeBase>;
  value?: ValueType<OptionTypeBase, any>;
  onChange: (selectedOption: ValueType<OptionTypeBase, any>) => void;
  components?: any;
  ref?: React.RefObject<ReactNode>;
  width?: number | "full";
  disabled?: boolean;
  hideSelectedOptions?: boolean;
  noDropDownIndicator?: boolean;
  formatOptionLabel?: Function;
  isOptionSelected?: Function;
  getOptionLabel?: Function;
  placeholder?: string;
  noOptionsMessage?: Function;
  isClearable?: boolean;
  isMulti?: boolean;
  allowSelectAll?: boolean;
  entityDropdown?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  disableTyping?: boolean;
  suggester?: boolean;
  oneLetter?: boolean;
}
export const Dropdown: React.FC<Dropdown> = ({
  options = [],
  value,
  onChange,
  components = undefined,
  width,
  isOptionSelected,
  getOptionLabel,
  formatOptionLabel,
  hideSelectedOptions = false,
  noDropDownIndicator = false,
  placeholder = "select..",
  noOptionsMessage = () => "no option selected",
  isClearable = false,
  isMulti = false,
  disabled = false,
  allowSelectAll = false,
  entityDropdown = false,
  onFocus = () => {},
  onBlur = () => {},
  disableTyping = false,
  suggester = false,
}) => {
  const optionsWithIterator = options[Symbol.iterator]();
  const isOneOptionSingleSelect = options.length < 2 && !isMulti;

  return (
    <StyledSelectWrapper width={width}>
      <StyledSelect
        suggester={suggester}
        onFocus={onFocus}
        onBlur={onBlur}
        isMulti={isMulti}
        isDisabled={disabled || isOneOptionSingleSelect}
        isOneOptionSingleSelect={isOneOptionSingleSelect}
        entityDropdown={entityDropdown}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder={placeholder}
        noOptionsMessage={noOptionsMessage}
        isClearable={isClearable}
        components={{
          components,
          Option,
          SingleValue,
          MultiValue,
          ValueContainer,
          DropdownIndicator,
        }}
        isSearchable={!disableTyping}
        {...(getOptionLabel ? { getOptionLabel: getOptionLabel } : {})}
        {...(formatOptionLabel ? { formatOptionLabel: formatOptionLabel } : {})}
        {...(isOptionSelected ? { isOptionSelected: isOptionSelected } : {})}
        value={value}
        styles={{
          dropdownIndicator: () => {
            return {
              display:
                noDropDownIndicator || isOneOptionSingleSelect ? "none" : "",
            };
          },
        }}
        onChange={(selected: any, event: any) => {
          if (selected !== null && selected.length > 0) {
            // kdyz je neco vybrany = aspon jeden option
            if (selected[selected.length - 1].value === allEntities.value) {
              // kdyz vyberu all option
              return onChange([allEntities, ...options]);
            }
            let result = [];
            if (selected.length === options.length) {
              // kdyz jsou vybrany vsechny
              if (selected.includes(allEntities)) {
                //
                result = selected.filter(
                  (option: { label: string; value: string }) =>
                    option.value !== allEntities.value
                );
              } else if (event.action === "select-option") {
                result = [allEntities, ...options];
              }
              return onChange(result);
            }
          }
          return onChange(selected);
        }}
        options={
          allowSelectAll ? [allEntities, ...optionsWithIterator] : options
        }
        width={width}
        hideSelectedOptions={hideSelectedOptions}
      />
    </StyledSelectWrapper>
  );
};

const SingleValue = (props: SingleValueProps<any>): React.ReactElement => {
  return (
    <>
      <components.SingleValue {...props}></components.SingleValue>
    </>
  );
};

const Option = ({ ...props }: OptionProps | any): React.ReactElement => {
  const { entityDropdown } = props.selectProps;
  return (
    <>
      {entityDropdown ? (
        <>
          {props.value && props.value !== DropdownAny ? (
            <components.Option {...props}>
              <StyledEntityValue color={Entities[props.value].color}>
                {props.label}
              </StyledEntityValue>
            </components.Option>
          ) : (
            <components.Option {...props}>
              <StyledEntityValue color={"transparent"}>
                {props.label}
              </StyledEntityValue>
            </components.Option>
          )}
        </>
      ) : (
        <components.Option {...props} />
      )}
    </>
  );
};

const MultiValue = (props: MultiValueProps<any>): React.ReactElement => {
  let labelToBeDisplayed = `${props.data.label}`;
  if (props.data.value === allEntities.value) {
    labelToBeDisplayed = "All is selected";
  }
  return (
    <components.MultiValue {...props}>
      <span>{labelToBeDisplayed}</span>
    </components.MultiValue>
  );
};

const ValueContainer = ({
  children,
  ...props
}: { children: any } & ValueContainerProps<
  any,
  any,
  any
>): React.ReactElement => {
  const currentValues: DropdownItem[] = props.getValue().map((v) => v);
  let toBeRendered = children;
  if (currentValues.some((val) => val.value === allEntities.value)) {
    toBeRendered = [[children[0][0]], children[1]];
  }

  return (
    <>
      <components.ValueContainer {...props}>
        {toBeRendered}
      </components.ValueContainer>
    </>
  );
};

const DropdownIndicator = (props: IndicatorProps<any, any>) => {
  return (
    <components.DropdownIndicator {...props}>
      <StyledFaChevronDown size={9} />
    </components.DropdownIndicator>
  );
};
