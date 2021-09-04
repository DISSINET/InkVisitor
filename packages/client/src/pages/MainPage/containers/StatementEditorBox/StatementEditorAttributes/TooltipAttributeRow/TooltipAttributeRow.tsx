import { AttributeIcon } from "components";
import React, { useMemo } from "react";
import { DropdownItem } from "types";
import { StyledRow, StyledValue } from "./TooltipAttributeRowStyles";

interface TooltipAttributeRow {
  attributeName: string;
  value?: string | string[];
  items: DropdownItem[];
}
export const TooltipAttributeRow: React.FC<TooltipAttributeRow> = ({
  attributeName,
  value,
  items,
}) => {
  const isArray = Array.isArray(value);
  const selectedItem = useMemo(
    () =>
      isArray && value
        ? items.filter((i: any) => value.includes(i.value))
        : items.find((i: any) => i.value === value),
    [value]
  );
  return (
    <>
      {selectedItem && (
        <StyledRow>
          <AttributeIcon attributeName={attributeName} />
          {isArray ? (
            (selectedItem as DropdownItem[]).map((item) => (
              <StyledValue>{item.label}</StyledValue>
            ))
          ) : (
            <StyledValue>{(selectedItem as DropdownItem)?.label}</StyledValue>
          )}
        </StyledRow>
      )}
    </>
  );
};
