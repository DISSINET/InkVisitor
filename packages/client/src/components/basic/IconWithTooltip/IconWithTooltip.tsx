import { Tooltip } from "components";
import { useTheme } from "hooks";
import React, { useRef, useState } from "react";
import { ThemeColor } from "Theme/theme";

interface IconWithTooltip {
  icon: React.ReactNode;
  tooltipLabel: string;
  color?: keyof ThemeColor;
}
export const IconWithTooltip: React.FC<IconWithTooltip> = ({
  icon,
  tooltipLabel,
  color = "black",
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
          color: theme.color[color] as string,
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
