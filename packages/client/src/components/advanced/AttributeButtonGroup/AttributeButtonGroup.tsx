import { Button } from "components";
import React from "react";
import { StyledPropButtonGroup } from "./AttributeButtonGroupStyles";

interface AttributeButtonGroup {
  options: {
    longValue: string;
    shortValue: string;
    onClick: Function;
    selected: boolean;
  }[];
  disabled?: boolean;
  noMargin?: boolean;
}

export const AttributeButtonGroup: React.FC<AttributeButtonGroup> = ({
  options = [],
  disabled = false,
  noMargin = false,
}) => {
  return disabled ? (
    <Button
      disabled
      label={options.find((o) => o.selected)?.longValue}
    ></Button>
  ) : (
    <StyledPropButtonGroup
      leftMargin={!noMargin}
      rightMargin={!noMargin}
      border={true}
      round={true}
    >
      {options.map((option, oi) => {
        const firstInRow = oi === 0;
        const lastInRow = oi === options.length - 1;
        return (
          <Button
            key={oi}
            label={option.selected ? option.longValue : option.shortValue}
            tooltip={option.longValue}
            noBorder
            inverted
            color={option.selected ? "primary" : "greyer"}
            textRegular={option.selected ? false : true}
            radiusLeft={firstInRow}
            radiusRight={lastInRow}
            onClick={() => {
              if (!option.selected && !disabled) {
                option.onClick();
              }
            }}
          />
        );
      })}
    </StyledPropButtonGroup>
  );
};
