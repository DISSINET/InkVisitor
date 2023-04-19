import React, { useEffect, useState } from "react";
import { StyledBold, StyledWrapper } from "./IconButtonGroupStyles";
import { Button } from "components";
import { EntityEnums } from "@shared/enums";

// Possible types for values - choosed in interface when using component
type ValueTypes =
  | EntityEnums.Elvl
  | EntityEnums.Position
  | EntityEnums.MoodVariant
  | EntityEnums.Logic;

type IconButtonGroup<TValue extends ValueTypes> = {
  attributeName?: string;
  border?: boolean;
  options: { value: TValue; label: string; info?: string }[];
  onChange: (value: TValue) => void;
  value: TValue;
  icons: { [key in TValue]: JSX.Element };
  disabled?: boolean;
};
export const IconButtonGroup = <TValue extends ValueTypes>({
  attributeName,
  border,
  options,
  onChange,
  value,
  icons,
  disabled = false,
}: IconButtonGroup<TValue>) => {
  return (
    <StyledWrapper border={border}>
      {options.map((option, key) => {
        return (
          <>
            {(!disabled || option.value === value) && (
              <Button
                key={key}
                icon={icons[option.value]}
                tooltipContent={
                  <p>
                    {attributeName ? (
                      <>
                        <StyledBold>{option.label}</StyledBold> ({attributeName}
                        )
                      </>
                    ) : (
                      <StyledBold>{option.label}</StyledBold>
                    )}
                  </p>
                }
                noBorder
                inverted
                color={option.value === value ? "primary" : "greyer"}
                onClick={() => {
                  if (option.value !== value) {
                    onChange(option.value);
                  }
                }}
              />
            )}
          </>
        );
      })}
    </StyledWrapper>
  );
};
