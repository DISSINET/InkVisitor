import { AttributeIcon } from "components";
import React, { useMemo } from "react";

interface TooltipAttributeRow {
  attributeName: string;
  value?: string | string[];
  items: { value: string; label: string }[];
}
export const TooltipAttributeRow: React.FC<TooltipAttributeRow> = ({
  attributeName,
  value,
  items,
}) => {
  const selectedItem = useMemo(
    () => items.find((i: any) => i.value === value),
    [value]
  );
  return (
    <>
      {selectedItem && (
        <div>
          <AttributeIcon attributeName={attributeName} />
          {selectedItem?.label}
        </div>
      )}
    </>
  );
};
