import { entitiesDictKeys } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { BaseDropdown, Tooltip } from "components";
import React, { useState } from "react";
import { components, OptionProps } from "react-select";
import { EntityColors } from "types";
import { StyledEntityValue } from "./DropdownStyles";

interface EntitySingleDropdown<T = string> {
  width?: number | "full";
  options: { value: T; label: string; info?: string }[];
  value: T;
  placeholder?: string;
  onChange: (value: T) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  suggester?: boolean;
  disableTyping?: boolean;
  disabled?: boolean;
  disableTooltip?: boolean;

  loggerId?: string;
}
export const EntitySingleDropdown = <T extends string>({
  width,
  options,
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
  suggester,
  disableTyping,
  disabled,
  disableTooltip,
  loggerId,
}: EntitySingleDropdown<T>) => {
  return (
    <BaseDropdown
      entityDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      options={options}
      onChange={(value) => onChange(value[0].value as T)}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      suggester={suggester}
      disableTyping={disableTyping}
      disabled={disabled}
      autoFocus={autoFocus}
      loggerId={loggerId}
      customComponents={{
        Option: (props: any) => (
          <Option {...props} disableTooltip={disableTooltip} />
        ),
      }}
    />
  );
};

const Option = ({
  disableTooltip,
  ...props
}: OptionProps<any> & { disableTooltip?: boolean }): React.ReactElement => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  return (
    <components.Option {...props}>
      <StyledEntityValue
        ref={setReferenceElement}
        color={EntityColors[props.data.value]?.color ?? "transparent"}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {props.data.label}
      </StyledEntityValue>
      {!disableTooltip &&
        props.data.value !== EntityEnums.Extension.Any &&
        props.data.value !== "" && (
          <Tooltip
            label={
              entitiesDictKeys[
                props.data.value as keyof typeof entitiesDictKeys
              ]?.label
            }
            visible={showTooltip}
            referenceElement={referenceElement}
            position="left"
          />
        )}
    </components.Option>
  );
};
