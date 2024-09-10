import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { heightHeader } from "Theme/constants";
import { Tooltip } from "components";
import React, { useState } from "react";
import {
  ActionMeta,
  ControlProps,
  DropdownIndicatorProps,
  GroupBase,
  MultiValueProps,
  OptionProps,
  SingleValueProps,
  ValueContainerProps,
  components,
} from "react-select";
import { SelectComponents } from "react-select/dist/declarations/src/components";
import { DropdownItem } from "types";
import {
  StyledFaChevronDown,
  StyledValueIconWrap,
  StyledSelect,
  StyledSelectWrapper,
} from "./BaseDropdownStyles";
import { MenuPortalProps } from "react-select/dist/declarations/src/components/Menu";

interface BaseDropdown {
  options?: DropdownItem[];
  value?: DropdownItem | DropdownItem[] | null;
  onChange: (
    selectedOption: DropdownItem[],
    event?: ActionMeta<unknown>
  ) => void;
  // appearance props
  width?: number | "full";
  placeholder?: string;
  noOptionsMessage?: string;
  icon?: JSX.Element;
  tooltipLabel?: string;
  // single entity dropdown props
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  suggester?: boolean;
  // dropdown type settings
  isMulti?: boolean;
  entityDropdown?: boolean;
  attributeDropdown?: boolean;
  //
  disableTyping?: boolean;
  disabled?: boolean;
  // override lib components
  customComponents?: Partial<
    SelectComponents<unknown, boolean, GroupBase<unknown>>
  >;
  // for logging / debugging purposes
  loggerId?: string;
  // currently unused props
  isClearable?: boolean;
  hideSelectedOptions?: boolean;
  noDropDownIndicator?: boolean;
}
export const BaseDropdown: React.FC<BaseDropdown> = ({
  options = [],
  value,
  onChange,
  customComponents = undefined,
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

  loggerId,
}) => {
  const isOneOptionSingleEntitySelect =
    options.length < 2 && !isMulti && entityDropdown;

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const localCustomComponents = {
    Option,
    SingleValue,
    MultiValue,
    ValueContainer,
    DropdownIndicator,
    Control,
    MenuPortal,
  };

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
          // menuIsOpen={loggerId === ""}
          suggester={suggester}
          onFocus={onFocus}
          autoFocus={autoFocus}
          onBlur={onBlur}
          isMulti={isMulti}
          isDisabled={disabled || isOneOptionSingleEntitySelect}
          isOneOptionSingleEntitySelect={isOneOptionSingleEntitySelect}
          isOptionDisabled={(option) =>
            (option as DropdownItem).isDisabled ? true : false
          }
          attributeDropdown={attributeDropdown}
          entityDropdown={entityDropdown}
          wildCardChar={
            (value as DropdownItem)?.label === EntityEnums.Extension.Any
          }
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={placeholder}
          noOptionsMessage={() => noOptionsMessage}
          isClearable={isClearable}
          captureMenuScroll={false}
          components={{ ...localCustomComponents, ...customComponents }}
          isSearchable={!disableTyping}
          value={value}
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
            } else {
              return onChange(selectedOptions, event);
            }
          }}
          options={options}
          width={width}
          hideSelectedOptions={hideSelectedOptions}
          loggerId={loggerId}
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

const SingleValue = (props: SingleValueProps): React.ReactElement => {
  return (
    <>
      <components.SingleValue {...props}></components.SingleValue>
    </>
  );
};

const Option = ({ ...props }: OptionProps | any): React.ReactElement => {
  return <components.Option {...props} />;
};

const ValueContainer = ({
  children,
  ...props
}: { children: any } & ValueContainerProps<any, any, any> & {
    selectProps: StyledSelect;
  }): React.ReactElement => {
  const currentValues: DropdownItem[] = [...props.getValue()];
  let toBeRendered = children;

  return (
    <components.ValueContainer {...props}>
      {toBeRendered}
    </components.ValueContainer>
  );
};

// If multiple, values are not merged into all options, this component is rendered separately for every single value
const MultiValue = (
  props: MultiValueProps<any> & { selectProps: StyledSelect }
): React.ReactElement => {
  let labelToBeDisplayed = `${props.data.label}`;

  return (
    <components.MultiValue {...props}>
      <span>{labelToBeDisplayed}</span>
    </components.MultiValue>
  );
};

const DropdownIndicator = (props: DropdownIndicatorProps) => {
  return (
    <components.DropdownIndicator {...props}>
      <StyledFaChevronDown size={9} />
    </components.DropdownIndicator>
  );
};

const Control = ({
  children,
  ...props
}: ControlProps<any, any, any> & { selectProps: StyledSelect }) => {
  const { icon } = props.selectProps;

  return (
    <components.Control {...props}>
      {icon && <StyledValueIconWrap>{icon}</StyledValueIconWrap>}
      {children}
    </components.Control>
  );
};

const MenuPortal: typeof components.MenuPortal = (
  props: MenuPortalProps<any, any, any> & { selectProps: StyledSelect }
) => {
  const { entityDropdown } = props.selectProps;

  return (
    <components.MenuPortal
      {...props}
      className={entityDropdown ? "react-select__entity-dropdown" : ""}
    />
  );
};
