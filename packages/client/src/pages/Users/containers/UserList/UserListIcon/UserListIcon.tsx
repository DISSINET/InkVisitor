import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";
import { Tooltip } from "components";
import React, { useState } from "react";

interface UserListIcon {
  icon: React.ReactNode;
  tooltipLabel?: string;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
}
export const UserListIcon: React.FC<UserListIcon> = ({
  icon,
  tooltipLabel,
  tooltipPosition,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <span
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
      </span>

      {tooltipLabel && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
          position={tooltipPosition}
        />
      )}
    </>
  );
};
