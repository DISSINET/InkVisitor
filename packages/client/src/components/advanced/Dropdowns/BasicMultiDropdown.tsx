import { DropdownItem } from "@inkvisitor/shared/types";
import { BaseDropdown } from "components";
import { StyledSelect } from "components/basic/BaseDropdown/BaseDropdownStyles";
import React from "react";
import { MultiValueProps, ValueContainerProps, components } from "react-select";

interface BasicMultiDropdown<T = string> {
  width?: number | "full";
  value: T[];
  onChange: (value: T[]) => void;
  options: {
    value: T;
    label: string;
    info?: string;
  }[];
  icon?: React.ReactNode;
  placeholder?: string;
  tooltipLabel?: string;
  disableTyping?: boolean;
  disabled?: boolean;

  loggerId?: string;
}
export const BasicMultiDropdown = <T extends string>({
  width,
  value,
  onChange,
  options,
  icon,
  placeholder,
  tooltipLabel,
  disableTyping = false,
  disabled,

  loggerId,
}: BasicMultiDropdown<T>) => {
  const getValues = (items: DropdownItem[]) => items.map((i) => i.value as T);

  return (
    <BaseDropdown
      isMulti
      width={width}
      placeholder={placeholder}
      tooltipLabel={tooltipLabel}
      icon={icon}
      options={options}
      value={options.filter((o) => value.includes(o.value as T))}
      onChange={(selectedOptions) => onChange(getValues(selectedOptions))}
      disableTyping={disableTyping}
      disabled={disabled}
      loggerId={loggerId}
      customComponents={{
        MultiValue: MultiValue as typeof components.MultiValue,
        ValueContainer,
      }}
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

  if (currentValues.length > 1) {
    // show only one merged value + the input
    toBeRendered = [children[0][0], children[1]];
  }

  return <components.ValueContainer {...props}>{toBeRendered}</components.ValueContainer>;
};

const MultiValue = (props: MultiValueProps<any>): React.ReactElement => {
  let labelToBeDisplayed = `${props.data.label}`;
  const { value } = props.selectProps;

  if (value.length > 1) {
    labelToBeDisplayed = `${value.length} selected`;
  }

  return (
    <components.MultiValue {...props}>
      <span>{labelToBeDisplayed}</span>
    </components.MultiValue>
  );
};
