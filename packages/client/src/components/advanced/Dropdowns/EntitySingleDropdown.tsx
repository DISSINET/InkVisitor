import { entitiesDictKeys } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { BaseDropdown, Tooltip, TypeBar } from "components";
import React, { useState } from "react";
import { components, OptionProps } from "react-select";
import styled from "styled-components";
import { EntityColors } from "types";
import { StyledEntityValue } from "./DropdownStyles";

/* Wraps the dropdown so the entity-class TypeBar sits flush on the left and is
   clipped to the rounded corners (same look as the suggester). */
const StyledEntityDropdownWrap = styled.div<{ $fullWidth: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? "flex" : "inline-flex")};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
`;

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
  /** Show the entity-class colour bar on the left. Defaults to true. */
  showTypeBar?: boolean;

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
  showTypeBar = true,
  loggerId,
}: EntitySingleDropdown<T>) => {
  const dropdown = (
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
        Option: (props: any) => <Option {...props} disableTooltip={disableTooltip} />,
      }}
    />
  );

  // The suggester renders its own TypeBar inside the grouped layout, so skip it
  // here to avoid duplicates.
  const typeBarVisible = showTypeBar && !suggester && !!EntityColors[value as string];

  if (!typeBarVisible) {
    return dropdown;
  }

  return (
    <StyledEntityDropdownWrap $fullWidth={width === "full"}>
      {dropdown}
      <TypeBar entityLetter={value as keyof typeof EntityColors} noMargin width={4} />
    </StyledEntityDropdownWrap>
  );
};

const Option = ({
  disableTooltip,
  ...props
}: OptionProps<any> & { disableTooltip?: boolean }): React.ReactElement => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

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
            label={entitiesDictKeys[props.data.value as keyof typeof entitiesDictKeys]?.label}
            visible={showTooltip}
            referenceElement={referenceElement}
            position="left"
          />
        )}
    </components.Option>
  );
};
