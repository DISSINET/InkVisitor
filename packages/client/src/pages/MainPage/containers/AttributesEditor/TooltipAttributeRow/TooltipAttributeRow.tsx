import { AttributeIcon } from "components";
import React, { useMemo } from "react";
import { DropdownItem } from "types";
import {
  StyledIconWrap,
  StyledRow,
  StyledValue,
  StyledValues,
} from "./TooltipAttributeRowStyles";

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
        <StyledRow key={attributeName}>
          <StyledIconWrap>
            <AttributeIcon attributeName={attributeName} />
          </StyledIconWrap>
          {isArray ? (
            <StyledValues>
              {(selectedItem as DropdownItem[]).map((item, key) => (
                <React.Fragment key={key}>
                  <StyledValue>{item.label}</StyledValue>
                  {key !== (selectedItem as DropdownItem[]).length - 1 && ","}
                </React.Fragment>
              ))}
            </StyledValues>
          ) : (
            <StyledValue>{(selectedItem as DropdownItem)?.label}</StyledValue>
          )}
        </StyledRow>
      )}
    </>
  );
};
