import { entitiesDictKeys } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { BaseDropdown, Tooltip, TypeBar } from "components";
import React, { useState } from "react";
import styled from "styled-components";
import { EntityColors } from "types";
import { StyledEntitySingleValue, StyledEntityValue } from "./DropdownStyles";

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
}: EntitySingleDropdown<T>) => {
  const isOneOptionSelect = options.length < 2;

  const dropdown = (
    <BaseDropdown
      width={width}
      value={options.find((o) => o.value === value)}
      options={options}
      onChange={(selected) => onChange(selected[0].value as T)}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      suggester={suggester}
      searchable={!disableTyping}
      disabled={disabled || isOneOptionSelect}
      /* a one-option select is quiet even when also explicitly disabled —
         the lone class reads as static text, not as a blocked control */
      disabledAppearance={isOneOptionSelect ? "quiet" : "stripes"}
      chevron={!isOneOptionSelect}
      autoFocus={autoFocus}
      renderOption={(o) => (
        <EntityOptionContent option={o} disableTooltip={disableTooltip} />
      )}
      renderValue={(o) => (
        /* the suggester's class box already carries its own wider margin from
           the core suggester styles — no extra entity offset on top of it */
        <StyledEntitySingleValue
          $wildcard={suggester || o.label === EntityEnums.Extension.Any}
        >
          {o.label}
        </StyledEntitySingleValue>
      )}
    />
  );

  // The suggester renders its own TypeBar inside the grouped layout, so skip it
  // here to avoid duplicates.
  const typeBarVisible =
    showTypeBar && !suggester && !!EntityColors[value as string];

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

const EntityOptionContent = ({
  option,
  disableTooltip,
}: {
  option: { value: string; label: string };
  disableTooltip?: boolean;
}): React.ReactElement => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  return (
    <>
      <StyledEntityValue
        ref={setReferenceElement}
        color={EntityColors[option.value]?.color ?? "transparent"}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {option.label}
      </StyledEntityValue>
      {!disableTooltip &&
        option.value !== EntityEnums.Extension.Any &&
        option.value !== "" && (
          <Tooltip
            label={
              entitiesDictKeys[option.value as keyof typeof entitiesDictKeys]
                ?.label
            }
            visible={showTooltip}
            referenceElement={referenceElement}
            position="left"
          />
        )}
    </>
  );
};
