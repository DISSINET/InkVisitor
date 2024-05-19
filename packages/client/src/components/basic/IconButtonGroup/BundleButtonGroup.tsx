import { Button } from "components";
import React from "react";
import { HiArrowDownTray, HiArrowUpTray } from "react-icons/hi2";
import { StyledWrapper } from "./IconButtonGroupStyles";

interface BundleButtonGroup {
  bundleStart: boolean;
  onBundleStartChange: (bundleStart: boolean) => void;
  bundleEnd: boolean;
  onBundleEndChange: (bundleStart: boolean) => void;
  disabled?: boolean;
}
export const BundleButtonGroup: React.FC<BundleButtonGroup> = ({
  bundleStart,
  onBundleStartChange,
  bundleEnd,
  onBundleEndChange,
  disabled,
}) => {
  return (
    <>
      {(!disabled || bundleStart || bundleEnd) && (
        <StyledWrapper $border>
          {!(disabled && !bundleStart) && (
            <Button
              disabled={disabled && !bundleStart}
              key="bundleStart"
              icon={
                <HiArrowUpTray
                  strokeWidth={2}
                  style={{ transform: "rotate(90deg)" }}
                />
              }
              tooltipLabel={"bundle start"}
              noBorder
              inverted
              color={bundleStart ? "primary" : "grey"}
              onClick={() => {
                if (!disabled) {
                  onBundleStartChange(!bundleStart);
                }
              }}
            />
          )}
          {!(disabled && !bundleEnd) && (
            <Button
              disabled={disabled && !bundleEnd}
              key="bundleEnd"
              icon={
                <HiArrowDownTray
                  strokeWidth={2}
                  style={{ transform: "rotate(270deg)" }}
                />
              }
              tooltipLabel={"bundle end"}
              noBorder
              inverted
              color={bundleEnd ? "primary" : "grey"}
              onClick={() => {
                if (!disabled) {
                  onBundleEndChange(!bundleEnd);
                }
              }}
            />
          )}
        </StyledWrapper>
      )}
    </>
  );
};
