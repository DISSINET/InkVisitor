import { Button } from "components";
import React from "react";
import { HiArrowDownTray, HiArrowUpTray } from "react-icons/hi2";
import { StyledWrapper } from "./IconButtonGroupStyles";

interface BundleButtonGroup {
  bundleStart: boolean;
  onBundleStartChange: (bundleStart: boolean) => void;
  bundleEnd: boolean;
  onBundleEndChange: (bundleStart: boolean) => void;
}
export const BundleButtonGroup: React.FC<BundleButtonGroup> = ({
  bundleStart,
  onBundleStartChange,
  bundleEnd,
  onBundleEndChange,
}) => {
  return (
    <StyledWrapper border>
      <Button
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
          onBundleStartChange(!bundleStart);
        }}
      />
      <Button
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
          onBundleEndChange(!bundleEnd);
        }}
      />
    </StyledWrapper>
  );
};
