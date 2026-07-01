import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import { StyledSelect } from "components/basic/BaseDropdown/BaseDropdownStyles";
import React from "react";
import { FaCheckSquare, FaRegSquare, FaRegUser } from "react-icons/fa";
import { components, OptionProps, ValueContainerProps } from "react-select";
import {
  StyledOptionIconWrap,
  StyledUserMoreBadge,
  StyledUserMultiValue,
  StyledUserMultiValueIcon,
  StyledUserMultiValueLabel,
  StyledUserOptionIconWrap,
  StyledUserOptionLabel,
  StyledUserOptionRow,
} from "./DropdownStyles";

interface UserMultiDropdown {
  width?: number | "full";
  value: string[];
  onChange: (value: string[]) => void;
  options: DropdownItem[];
  placeholder?: string;
  noOptionsMessage?: string;

  disableTyping?: boolean;
  disabled?: boolean;

  isClearable?: boolean;
  limitSelectedItems?: number;

  loggerId?: string;
  closeMenuOnSelect?: boolean;
}
export const UserMultiDropdown = ({
  width,
  value,
  onChange,
  options,
  placeholder,
  noOptionsMessage,

  disableTyping = false,
  disabled,

  isClearable = true,
  limitSelectedItems,

  loggerId,
  closeMenuOnSelect = false,
}: UserMultiDropdown) => {
  return (
    <BaseDropdown
      userDropdown
      width={width}
      isMulti
      isClearable={isClearable}
      options={options}
      value={options.filter((o) => value.includes(o.value))}
      onChange={(selectedOptions) => {
        const selected = selectedOptions ?? [];
        onChange(selected.map((o) => o.value));
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
    />
  );
};

const ValueContainer = ({
  children,
  ...props
}: { children: any } & ValueContainerProps<any, any, any> & {
    selectProps: StyledSelect;
  }): React.ReactElement => {
  const currentValues: DropdownItem[] = [...props.getValue()];
  let toBeRendered = children;

  if (currentValues.length > 0) {
    const renderedChildren = children[0];

    const limit = props.selectProps.limitSelectedItems;
    // Show limited number of users; the rest collapse into a "+X more" badge,
    // which wraps onto a new line below the visible chips
    const remainingCount = limit ? renderedChildren.length - limit : 0;

    const visibleChildren = limit ? renderedChildren.slice(0, limit) : renderedChildren;
    const displayRemainingCount = remainingCount > 0 ? remainingCount : 0;

    toBeRendered = [
      [
        ...visibleChildren,
        ...(displayRemainingCount > 0
          ? [
              <StyledUserMoreBadge key="more-badge">
                +{displayRemainingCount} more
              </StyledUserMoreBadge>,
            ]
          : []),
      ],
      children[1],
    ];
  }

  return <components.ValueContainer {...props}>{toBeRendered}</components.ValueContainer>;
};

const MultiValue = (props: any): React.ReactElement => {
  return (
    <components.MultiValue {...props}>
      <StyledUserMultiValue>
        <StyledUserMultiValueIcon>
          <FaRegUser size={12} />
        </StyledUserMultiValueIcon>
        <StyledUserMultiValueLabel>{props.data.label}</StyledUserMultiValueLabel>
      </StyledUserMultiValue>
    </components.MultiValue>
  );
};

const Option = ({ ...props }: OptionProps | any): React.ReactElement => {
  return (
    <components.Option {...props}>
      <StyledUserOptionRow>
        <StyledOptionIconWrap>
          {props.isSelected ? <FaCheckSquare /> : <FaRegSquare />}
        </StyledOptionIconWrap>
        <StyledUserOptionIconWrap>
          <FaRegUser size={14} />
        </StyledUserOptionIconWrap>
        <StyledUserOptionLabel>{props.label}</StyledUserOptionLabel>
      </StyledUserOptionRow>
    </components.Option>
  );
};
