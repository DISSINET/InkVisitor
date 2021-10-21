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
}

export const AttributeButtonGroup: React.FC<IAttributeButtonGroup> = ({
  options = [],
}) => {
  return (
    <StyledPropButtonGroup leftMargin={true} border={true} round={false}>
      {options.map((option, oi) => {
        const firstInRow = oi === 0;
        const lastInRow = oi === options.length - 1;
        return (
          <Button
            key={oi}
            label={option.selected ? option.longValue : option.shortValue}
            tooltip={option.longValue}
            noBorder
            inverted={!option.selected}
            // radiusLeft={firstInRow}
            // radiusRight={lastInRow}
            onClick={() => {
              if (!option.selected) {
                option.onClick();
              }
            }}
          />
        );
      })}
    </StyledPropButtonGroup>
  );
};
