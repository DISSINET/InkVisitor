import React from "react";
import { AttributeIcon } from "components";
import { StyledIconWrap, StyledRow } from "./TooltipBooleanRowStyles";

interface TooltipBooleanRow {
  attributeName: string;
  label: string;
  show: boolean;
}
export const TooltipBooleanRow: React.FC<TooltipBooleanRow> = ({
  attributeName,
  label,
  show,
}) => {
  return (
    <>
      {show && (
        <StyledRow>
          <StyledIconWrap>
            <AttributeIcon attributeName={attributeName} />
          </StyledIconWrap>
          {label}
        </StyledRow>
      )}
    </>
  );
};
