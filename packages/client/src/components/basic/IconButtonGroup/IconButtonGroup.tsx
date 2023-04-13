import React, { useEffect, useState } from "react";
import { StyledWrapper } from "./IconButtonGroupStyles";
import { Button } from "components";
import { EntityEnums } from "@shared/enums";

// Possible types for values - choosed in interface when using component
type ValueTypes =
  | EntityEnums.Elvl
  | EntityEnums.Position
  | EntityEnums.MoodVariant
  | EntityEnums.Logic;

type IconButtonGroup<TValue extends ValueTypes> = {
  border?: boolean;
  options: { value: TValue; label: string; info?: string }[];
  onChange: (value: TValue) => void;
  value: TValue;
  icons: { [key in TValue]: JSX.Element };
};
export const IconButtonGroup = <TValue extends ValueTypes>({
  border,
  options,
  onChange,
  value,
  icons,
}: IconButtonGroup<TValue>) => {
  // const [localValue, setLocalValue] = useState<TValue | false>(false);

  // useEffect(() => {
  //   setLocalValue(value);
  // }, [value]);

  return (
    <StyledWrapper border={border}>
      {options.map((option, key) => {
        return (
          <Button
            key={key}
            icon={icons[option.value]}
            tooltipLabel={option.label}
            noBorder
            inverted
            color={option.value === value ? "primary" : "greyer"}
            onClick={() => {
              if (option.value !== value) {
                onChange(option.value);
              }
            }}
          />
        );
      })}
    </StyledWrapper>
  );
};
