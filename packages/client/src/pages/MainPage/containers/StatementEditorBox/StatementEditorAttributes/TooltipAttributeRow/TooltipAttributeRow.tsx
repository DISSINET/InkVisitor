import { AttributeIcon } from "components";
import React, { useMemo } from "react";

interface TooltipAttributeRow {
  attributeName: string;
  value?: string | string[];
}
export const TooltipAttributeRow: React.FC<TooltipAttributeRow> = ({
  attributeName,
  value,
}) => {
  return (
    <>
      {value && (
        <div>
          <AttributeIcon attributeName={attributeName} />
          {value}
        </div>
      )}
    </>
  );
};
