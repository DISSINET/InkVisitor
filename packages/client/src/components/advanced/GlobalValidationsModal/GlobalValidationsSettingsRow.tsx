import {
  globalValidationsDict,
  WarningKey,
  WarningTypeEnums,
} from "@shared/enums/warning";
import React, { useState } from "react";
import {
  StyledGridFormLabel,
  StyledToggleWrap,
} from "./GlobalValidationsModalStyles";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Tooltip } from "components";

interface GlobalValidationsSettingsRow {
  validation: WarningKey;
  active: boolean;
  toggleRule: () => void;
}
export const GlobalValidationsSettingsRow: React.FC<
  GlobalValidationsSettingsRow
> = ({ validation, active, toggleRule }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipLabel = globalValidationsDict[validation].label;
  const tooltipContent = globalValidationsDict[validation].description;

  const isDisabled = !globalValidationsDict[validation].editAllowed;
  return (
    <>
      <StyledGridFormLabel
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        $disabled={isDisabled}
      >
        {globalValidationsDict[validation].label}
      </StyledGridFormLabel>
      <div>
        <StyledToggleWrap
          $active={active}
          $disabled={isDisabled}
          onClick={() => !isDisabled && toggleRule()}
        >
          {active ? (
            <>
              <FaToggleOn size={22} /> active
            </>
          ) : (
            <>
              <FaToggleOff size={22} /> inactive
            </>
          )}
        </StyledToggleWrap>
      </div>

      {tooltipContent && (
        <Tooltip
          label={tooltipLabel}
          content={<p>{tooltipContent}</p>}
          visible={showTooltip}
          referenceElement={referenceElement}
          // position={tooltipPosition}
        />
      )}
    </>
  );
};
