import { Button } from "components";
import React, { ReactNode } from "react";
import styled from "styled-components";
import { StyledPropButtonGroup } from "./../StatementEditorBox/StatementEditorBoxStyles";

interface IAttributeButtonGroup {
  options: {
    longValue: string;
    shortValue: string;
    onClick: Function;
    selected: boolean;
  }[];
  disabled?: boolean;
}

export const AttributeButtonGroup: React.FC<IAttributeButtonGroup> = ({
  options = [],
  disabled = false,
}) => {
  return disabled ? (
    <Button
      disabled
      label={options.find((o) => o.selected)?.longValue}
    ></Button>
  ) : (
    <StyledPropButtonGroup
      leftMargin={true}
      rightMargin={true}
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
