import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
} from "@popperjs/core";
import { Tooltip } from "components";
import { useTheme } from "hooks";
import React, { ReactElement, useState } from "react";
import { ThemeColor } from "Theme/theme";

interface IconWithTooltip {
  icon: React.ReactNode;
  tooltipLabel?: string;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
  color?: keyof ThemeColor;
  fullWidth?: boolean;
  tooltipText?: string;
  // rich tooltip body, overrides tooltipText when provided
  tooltipContent?: ReactElement[] | ReactElement;
  // tooltip background color (defaults to Tooltip's own default)
  tooltipColor?: keyof ThemeColor;
}
export const IconWithTooltip: React.FC<IconWithTooltip> = ({
  icon,
  tooltipLabel,
  tooltipPosition = "bottom",
  color = "black",
  fullWidth = false,
  tooltipText,
  tooltipContent,
  tooltipColor,
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
      {(tooltipLabel || tooltipText || tooltipContent) && (
        <Tooltip
          label={tooltipLabel}
          visible={showTooltip}
          referenceElement={referenceElement}
          position={tooltipPosition}
          content={tooltipContent ?? (tooltipText ? <p>{tooltipText}</p> : undefined)}
          color={tooltipColor}
        />
      )}
    </>
  );
};
