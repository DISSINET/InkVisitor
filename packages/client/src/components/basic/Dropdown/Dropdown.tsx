import { allEntities } from "@shared/dictionaries/entity";
import React, { ReactNode, useEffect, useState } from "react";
import {
  components,
  ControlProps,
  MultiValueProps,
  SingleValueProps,
  ValueContainerProps,
  OptionProps,
  DropdownIndicatorProps,
  ActionMeta,
} from "react-select";
import {
  DropdownAny,
  DropdownEmpty,
  heightHeader,
  wildCardChar,
} from "Theme/constants";
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
  options?: DropdownItem[];
  value?: DropdownItem | DropdownItem[] | null;
  onChange: (selectedOption: DropdownItem[]) => void;
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
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  disableTyping?: boolean;
  suggester?: boolean;

  icon?: JSX.Element;
  tooltipLabel?: string;

  entityDropdown?: boolean;
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
  onFocus = () => {},
  onBlur = () => {},
  autoFocus = false,
  disableTyping = false,
  suggester = false,

  icon,
  tooltipLabel,
  entityDropdown = false,
  attributeDropdown,

  allowAny = false,
}) => {
  const optionsWithIterator = options[Symbol.iterator]();
  const isOneOptionSingleEntitySelect =
    options.length < 2 && !isMulti && entityDropdown;

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
          isDisabled={disabled || isOneOptionSingleEntitySelect}
          isOneOptionSingleEntitySelect={isOneOptionSingleEntitySelect}
          attributeDropdown={attributeDropdown}
          entityDropdown={entityDropdown}
          wildCardChar={(value as DropdownItem)?.label === "*"}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={placeholder}
          noOptionsMessage={() => noOptionsMessage}
          isClearable={isClearable}
          captureMenuScroll={false}
          components={{
            Option,
            SingleValue,
            MultiValue,
            ValueContainer,
            DropdownIndicator,
            Control,
            MenuPortal,
          }}
          isSearchable={!disableTyping}
          value={displayValue}
          icon={icon}
          styles={{
            dropdownIndicator: () => {
              return {
                display:
                  noDropDownIndicator || isOneOptionSingleEntitySelect
                    ? "none"
                    : "",
              };
            },
            menuPortal: (base) => ({
              ...base,
              marginTop: `${-heightHeader}px`,
              zIndex: 9999,
            }),
          }}
          menuPortalTarget={document.getElementById("page")!}
          menuPosition="absolute"
          onChange={(selected: unknown, event: ActionMeta<unknown>) => {
            const selectedOptions: DropdownItem[] = Array.isArray(selected)
              ? selected
              : [selected];

            if (!isMulti) {
              return onChange(selectedOptions);
            }

            if (selectedOptions !== null && selectedOptions.length > 0) {
              // kdyz je neco vybrany = aspon jeden option
              if (attributeDropdown && event.action === "remove-value") {
                return onChange([]);
              }
              if (
                selectedOptions[selectedOptions.length - 1].value ===
                allEntities.value
              ) {
                // kdyz vyberu all option
                return onChange([allEntities, ...options]);
              }
              let result: DropdownItem[] = [];
              if (selectedOptions.length === options.length) {
                // kdyz jsou vybrany vsechny
                if (selectedOptions.includes(allEntities)) {
                  //
                  result = selectedOptions.filter(
                    (option: { label: string; value: string }) =>
                      option.value !== allEntities.value
                  );
                } else if (event.action === "select-option") {
                  result = [allEntities, ...options];
                }
                return onChange(result);
              }
            }
            return onChange(selectedOptions);
          }}
          options={isMulti ? [allEntities, ...optionsWithIterator] : options}
          width={width}
          hideSelectedOptions={hideSelectedOptions}
        />
      </StyledSelectWrapper>

      {/* Tooltip */}
      {tooltipLabel && (
        <Tooltip
          disabled={isMulti && (value as DropdownItem[])?.length === 0}
          content={
            <p>
              {isMulti ? (
                <>
                  <b>
                    {(value as DropdownItem[]).map((v, key) => {
                      return (
                        <React.Fragment key={key}>
                          {v.value !== allEntities.value && (
                            <>
                              {v.label}
                              {key !== (value as DropdownItem[])?.length - 1 &&
                                ", "}
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </b>{" "}
                  ({tooltipLabel})
                </>
              ) : (
                <b>{tooltipLabel}</b>
              )}
            </p>
          }
          visible={showTooltip}
          referenceElement={referenceElement}
          position="top"
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
          {props.value &&
          props.value !== DropdownAny &&
          props.value !== wildCardChar &&
          props.value !== DropdownEmpty ? (
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
  // @ts-ignore
  const { attributeDropdown, entityDropdown, isMulti, value, options } =
    props.selectProps;

  if (attributeDropdown && isMulti && value.length > 1) {
    if (value.length === options?.length) {
      labelToBeDisplayed = `${value.length - 1} selected`;
    } else {
      labelToBeDisplayed = `${value.length} selected`;
    }
  } else if (
    entityDropdown &&
    isMulti &&
    props.data.value === allEntities.value
  ) {
    // TODO:
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
    // @ts-ignore
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

const DropdownIndicator = (props: DropdownIndicatorProps) => {
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

const MenuPortal: typeof components.MenuPortal = (props) => {
  // @ts-ignore
  const { entityDropdown } = props.selectProps;

  return (
    <components.MenuPortal
      {...props}
      className={entityDropdown ? "react-select__entity-dropdown" : ""}
    />
  );
};
