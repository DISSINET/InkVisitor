import { AttributeIcon } from "components";
import React from "react";
import { StyledIconWrap, StyledRow } from "./TooltipBooleanRowStyles";
import { attributeIconsKeys } from "components/basic/AttributeIcon/AttributeIcon";

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
            <AttributeIcon
              attributeName={attributeName as keyof typeof attributeIconsKeys}
            />
          </StyledIconWrap>
          {label}
        </StyledRow>
      )}
    </>
  );
};
