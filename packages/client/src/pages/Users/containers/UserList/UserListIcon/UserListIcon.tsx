import { Tooltip } from "components";
import React, { useState } from "react";

interface UserListIcon {
  icon: React.ReactNode;
  tooltipLabel?: string;
}
export const UserListIcon: React.FC<UserListIcon> = ({
  icon,
  tooltipLabel,
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
          // position={tooltipPosition}
        />
      )}
    </>
  );
};
