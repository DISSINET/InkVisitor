import { Button } from "components";
import React from "react";
import { ButtonShape } from "types";
import { StyledButtonWrap, StyledPropButtonGroup, StyledWrap } from "./AttributeButtonGroupStyles";

interface AttributeButtonGroup {
  options: {
    longValue: string;
    shortValue: string;
    shortIcon?: React.ReactNode;
    icon?: React.ReactNode;
    onClick: () => void;
    selected: boolean;
    optionDisabled?: boolean;
  }[];
  disabled?: boolean;
  // currently means no horizontal margin
  noMargin?: boolean;
  paddingX?: boolean;

  fullSizeDisabled?: boolean;
  disabledBtnsTooltip?: string;
  canSelectMultiple?: boolean;
  iconsOnly?: boolean;
  fullWidth?: boolean;
}

export const AttributeButtonGroup: React.FC<AttributeButtonGroup> = ({
  options = [],
  disabled = false,
  noMargin = false,
  paddingX = false,
  fullSizeDisabled = false,
  disabledBtnsTooltip,
  canSelectMultiple = false,
  iconsOnly = false,
  fullWidth = false,
}) => {
  // With exactly two options, the whole group acts as a single toggle:
  // clicking any segment switches to the other option.
  const isToggle = options.length === 2 && !canSelectMultiple;

  return (
    <StyledWrap>
      {disabled && !fullSizeDisabled ? (
        <StyledButtonWrap $leftMargin={!noMargin} $rightMargin={!noMargin}>
          <Button disabled shape="rounded-md" label={options.find((o) => o.selected)?.longValue} />
        </StyledButtonWrap>
      ) : (
        <StyledPropButtonGroup
          $leftMargin={!noMargin}
          $rightMargin={!noMargin}
          $border
          $fullWidth={iconsOnly || fullWidth}
        >
          {options.map((option, oi) => {
            const firstInRow = oi === 0;
            const lastInRow = oi === options.length - 1;
            const shape: ButtonShape | undefined =
              firstInRow && lastInRow
                ? "rounded-md"
                : firstInRow
                  ? "rounded-left-lg"
                  : lastInRow
                    ? "rounded-right-lg"
                    : option.selected
                      ? "sharp"
                      : undefined;
            return (
              <Button
                key={oi}
                disabled={option.optionDisabled || (disabled && !option.selected)}
                fullWidth={iconsOnly || fullWidth}
                label={
                  iconsOnly
                    ? undefined
                    : option.selected
                      ? option.longValue
                      : option.shortValue !== undefined
                        ? option.shortValue
                        : option.longValue
                }
                icon={
                  option.icon
                    ? option.icon
                    : !option.selected && option.shortIcon
                      ? option.shortIcon
                      : undefined
                }
                tooltipLabel={
                  (!option.selected || iconsOnly) &&
                  (option.longValue !== option.shortValue || option.icon)
                    ? option.longValue
                    : undefined
                }
                noBorder
                inverted
                color={option.selected ? "primary" : "greyer"}
                textRegular={option.selected ? false : true}
                shape={shape}
                onClick={() => {
                  if (disabled) {
                    return;
                  }
                  if (isToggle) {
                    options.find((o) => !o.selected)?.onClick();
                    return;
                  }
                  if (!option.selected || canSelectMultiple) {
                    option.onClick();
                  }
                }}
              />
            );
          })}
        </StyledPropButtonGroup>
      )}
    </StyledWrap>
  );
};
