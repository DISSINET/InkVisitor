import React from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { StyledToggle } from "./ToggleStyles";

interface Toggle {
  value: boolean;
  onChange: (value: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: number;
  hideLabels?: boolean;
}
export const Toggle: React.FC<Toggle> = ({
  value,
  onChange,
  activeLabel = "active",
  inactiveLabel = "inactive",
  size = 22,
  hideLabels = false,
}) => {
  return (
    <StyledToggle $active={value} onClick={() => onChange(!value)}>
      {value ? (
        <>
          <FaToggleOn size={size} /> {!hideLabels && activeLabel}
        </>
      ) : (
        <>
          <FaToggleOff size={size} /> {!hideLabels && inactiveLabel}
        </>
      )}
    </StyledToggle>
  );
};
