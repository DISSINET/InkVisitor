import { Button } from "components";
import React from "react";
import { StyledPropButtonGroup } from "./AttributeButtonGroupStyles";

type Option = {
  longValue: string;
  shortValue: string;
  shortIcon?: JSX.Element;
  icon?: JSX.Element;
  onClick: () => void;
  selected: boolean;
};
interface AttributeButtonGroup {
  options: Option[];
  disabled?: boolean;
  noMargin?: boolean;
  paddingX?: boolean;

  fullSizeDisabled?: boolean;
  disabledBtnsTooltip?: string;
}

export const AttributeButtonGroup: React.FC<AttributeButtonGroup> = ({
  options = [],
  disabled = false,
  noMargin = false,
  paddingX = false,

  fullSizeDisabled = false,
  disabledBtnsTooltip,
}) => {
  const getTooltipLabel = (option: Option) => {
    if (!disabled) {
      return option.longValue === option.shortValue
        ? undefined
        : !option.selected
        ? option.longValue
        : undefined;
    } else if (disabled && !option.selected && disabledBtnsTooltip) {
      return disabledBtnsTooltip;
    }
  };
  return disabled && !fullSizeDisabled ? (
    <StyledPropButtonGroup
      $border
      $round
      $leftMargin={!noMargin}
      $rightMargin={!noMargin}
    >
      <Button
        disabled
        label={options.find((o) => o.selected)?.longValue}
        noBorder
        radiusLeft
        radiusRight
      />
    </StyledPropButtonGroup>
  ) : (
    <StyledPropButtonGroup
      $leftMargin={!noMargin}
      $rightMargin={!noMargin}
      $border
      $round
    >
      {options.map((option, oi) => {
        const firstInRow = oi === 0;
        const lastInRow = oi === options.length - 1;
        return (
          <Button
            disabled={disabled && !option.selected}
            key={oi}
            label={option.selected ? option.longValue : option.shortValue}
            icon={
              option.icon
                ? option.icon
                : !option.selected && option.shortIcon
                ? option.shortIcon
                : undefined
            }
            tooltipLabel={getTooltipLabel(option)}
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
