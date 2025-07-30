import { Tooltip } from "components";
import React, { useRef, useState } from "react";

interface IconWithTooltip {
  icon: React.ReactNode;
  tooltipLabel: string;
}
export const IconWithTooltip: React.FC<IconWithTooltip> = ({
  icon,
  tooltipLabel,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        ref={setReferenceElement}
      >
        {icon}
      </div>
      {tooltipLabel && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
          position="bottom"
        />
      )}
    </>
  );
};
