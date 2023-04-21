import { allEntities } from "@shared/dictionaries/entity";
import React, { ReactNode, useEffect, useState } from "react";
import {
  components,
  ControlProps,
  GroupedOptionsType,
  IndicatorProps,
  MultiValueProps,
  OptionsType,
  OptionTypeBase,
  SingleValueProps,
  ValueContainerProps,
  ValueType,
} from "react-select";
import { OptionProps } from "react-select/src/types";
import { DropdownAny } from "Theme/constants";
import { DropdownItem, EntityColors } from "types";
import {
  StyledEntityValue,
  StyledFaChevronDown,
  StyledIconWrap,
  StyledSelect,
  StyledSelectWrapper,
} from "./DropdownStyles";
import { Tooltip } from "components";

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
  placeholder?: string;
  noOptionsMessage?: string;
  isClearable?: boolean;
  isMulti?: boolean;
  entityDropdown?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  disableTyping?: boolean;
  suggester?: boolean;

  icon?: JSX.Element;
  tooltipLabel?: string;
  attributeDropdown?: boolean;

  // TODO: not implemented yet
  allowAny?: boolean;
}
export const Dropdown: React.FC<Dropdown> = ({
  options = [],
  value,
  onChange,
  components = undefined,
  width,
  hideSelectedOptions = false,
  noDropDownIndicator = false,
  placeholder = "select..",
  noOptionsMessage = "no option selected",
  isClearable = false,
  isMulti = false,
  disabled = false,
  entityDropdown = false,
  onFocus = () => {},
  onBlur = () => {},
  autoFocus = false,
  disableTyping = false,
  suggester = false,

  icon,
  tooltipLabel,
  attributeDropdown,

  allowAny = false,
}) => {
  const optionsWithIterator = options[Symbol.iterator]();
  const isOneOptionSingleSelect = options.length < 2 && !isMulti;

  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledSelectWrapper
        width={width}
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(false)}
      >
        <StyledSelect
          suggester={suggester}
          onFocus={onFocus}
          autoFocus={autoFocus}
          onBlur={onBlur}
          isMulti={isMulti}
          isDisabled={disabled || isOneOptionSingleSelect}
          isOneOptionSingleSelect={isOneOptionSingleSelect}
          entityDropdown={entityDropdown}
          wildCardChar={(value as DropdownItem)?.label === "*"}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={placeholder}
          noOptionsMessage={() => noOptionsMessage}
          isClearable={isClearable}
          captureMenuScroll={false}
          components={{
            components,
            Option,
            SingleValue,
            MultiValue,
            ValueContainer,
            DropdownIndicator,
            Control,
          }}
          isSearchable={!disableTyping}
          value={displayValue}
          icon={icon}
          attributeDropdown={attributeDropdown}
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
              if (attributeDropdown && event.action === "remove-value") {
                return onChange([]);
              }
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
          options={isMulti ? [allEntities, ...optionsWithIterator] : options}
          width={width}
          hideSelectedOptions={hideSelectedOptions}
        />
      </StyledSelectWrapper>

      {/* Tooltip */}
      {tooltipLabel && (
        <Tooltip
          content={
            <p>
              {isMulti ? (
                <>
                  <b>
                    {(value as DropdownItem[]).map((v, key) => {
                      return (
                        <React.Fragment key={key}>
                          {v.label}
                          {key !== value?.length - 1 && ", "}
                        </React.Fragment>
                      );
                    })}
                  </b>{" "}
                  ({tooltipLabel})
                </>
              ) : (
                tooltipLabel
              )}
            </p>
          }
          visible={showTooltip}
          referenceElement={referenceElement}
        />
      )}
    </>
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
              <StyledEntityValue color={EntityColors[props.value].color}>
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
  const { attributeDropdown, isMulti, value } = props.selectProps;
  if (attributeDropdown && isMulti && value.length > 1) {
    labelToBeDisplayed = `${value.length} selected`;
  } else if (props.data.value === allEntities.value) {
    labelToBeDisplayed = "All options selected";
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
  if (
    currentValues.some((val) => val.value === allEntities.value) ||
    (props.selectProps.attributeDropdown && props.selectProps.value.length > 1)
  ) {
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

const Control = ({ children, ...props }: ControlProps<any, false>) => {
  // @ts-ignore
  const { icon } = props.selectProps;

  return (
    <components.Control {...props}>
      {icon && <StyledIconWrap>{icon}</StyledIconWrap>}
      {children}
    </components.Control>
  );
};
