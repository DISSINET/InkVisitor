import React from "react";
import { AttributeIcon } from "components";
import { StyledRow } from "./TooltipBooleanRowStyles";

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
          <AttributeIcon attributeName={attributeName} />
          {label}
        </StyledRow>
      )}
    </>
  );
};
