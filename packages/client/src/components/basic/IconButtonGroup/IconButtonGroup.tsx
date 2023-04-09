import React, { useEffect, useState } from "react";
import { StyledWrapper } from "./IconButtonGroupStyles";
import { Button } from "components";
import { EntityEnums } from "@shared/enums";

type IconButtonGroupValue<
  TValue extends
    | EntityEnums.Elvl
    | EntityEnums.Position
    | EntityEnums.Mood
    | EntityEnums.MoodVariant
    | EntityEnums.Logic
> = {
  border?: boolean;
  // values: map() z dictionary.value coz by bylo ve wrapper komponente, ale potrebuju sem poslat i tak dictionary, kvuli labelu pro tooltip
  values: TValue[];
  onChange: (value: TValue) => void;
  value: TValue;
  icons: { [key in TValue]: JSX.Element };
};
export const IconButtonGroupValue = <
  TValue extends
    | EntityEnums.Elvl
    | EntityEnums.Position
    | EntityEnums.Mood
    | EntityEnums.MoodVariant
    | EntityEnums.Logic
>({
  border,
  values,
  onChange,
  value,
  icons,
}: IconButtonGroupValue<TValue>) => {
  const [localValue, setLocalValue] = useState<TValue | false>(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <StyledWrapper border={border}>
      {values.map((value, key) => {
        return (
          <Button
            key={key}
            icon={icons[value]}
            // tooltipLabel={option.label}
            noBorder
            inverted
            color={value === localValue ? "primary" : "greyer"}
            onClick={() => {
              if (value !== localValue) {
                onChange(value);
              }
            }}
          />
        );
      })}
    </StyledWrapper>
  );
};
