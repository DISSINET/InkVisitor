import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";
import { Tooltip } from "components";
import { useTheme } from "hooks";
import React, { useState } from "react";
import { ThemeColor } from "Theme/theme";

interface IconWithTooltip {
  icon: React.ReactNode;
  tooltipLabel: string;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  color?: keyof ThemeColor;
  fullWidth?: boolean;
  tooltipText?: string;
}
export const IconWithTooltip: React.FC<IconWithTooltip> = ({
  icon,
  tooltipLabel,
  tooltipPosition = "bottom",
  color = "black",
  fullWidth = false,
  tooltipText,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const theme = useTheme();

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          color: theme.color[color] as string,
          width: fullWidth ? "100%" : "auto",
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
          position={tooltipPosition}
          content={<p>{tooltipText}</p>}
        />
      )}
    </>
  );
};
