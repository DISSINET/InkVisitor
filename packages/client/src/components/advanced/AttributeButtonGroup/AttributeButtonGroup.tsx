import { Button } from "components";
import React from "react";
import {
  StyledButtonWrap,
  StyledPropButtonGroup,
} from "./AttributeButtonGroupStyles";

interface AttributeButtonGroup {
  options: {
    longValue: string;
    shortValue: string;
    shortIcon?: JSX.Element;
    icon?: JSX.Element;
    onClick: () => void;
    selected: boolean;
  }[];
  disabled?: boolean;
  noMargin?: boolean;
  paddingX?: boolean;
}

export const AttributeButtonGroup: React.FC<AttributeButtonGroup> = ({
  options = [],
  disabled = false,
  noMargin = false,
  paddingX = false,
}) => {
  return disabled ? (
    <StyledButtonWrap leftMargin={!noMargin} rightMargin={!noMargin}>
      <Button disabled label={options.find((o) => o.selected)?.longValue} />
    </StyledButtonWrap>
  ) : (
    <StyledPropButtonGroup
      leftMargin={!noMargin}
      rightMargin={!noMargin}
      border
      round
    >
      {options.map((option, oi) => {
        const firstInRow = oi === 0;
        const lastInRow = oi === options.length - 1;
        return (
          <Button
            key={oi}
            label={option.selected ? option.longValue : option.shortValue}
            icon={
              option.icon
                ? option.icon
                : !option.selected && option.shortIcon
                ? option.shortIcon
                : undefined
            }
            tooltipLabel={
              option.longValue === option.shortValue
                ? undefined
                : option.longValue
            }
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
            paddingX={paddingX}
          />
        );
      })}
    </StyledPropButtonGroup>
  );
};
