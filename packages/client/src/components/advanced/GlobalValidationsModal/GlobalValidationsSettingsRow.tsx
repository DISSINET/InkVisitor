import {
  globalValidationsDict,
  ValidationKey,
  WarningKey,
  WarningTypeEnums,
} from "@inkvisitor/shared/enums/warning";
import React, { useState } from "react";
import {
  StyledGridFormLabel,
  StyledToggleWrap,
} from "./GlobalValidationsModalStyles";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Tooltip, WarningIcon } from "components";

interface GlobalValidationsSettingsRow {
  validation: ValidationKey;
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

  return (
    <>
      <StyledGridFormLabel
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <WarningIcon
          type={validation.replace("validation_", "") as WarningTypeEnums}
          size={16}
        />
        {globalValidationsDict[validation].label}
      </StyledGridFormLabel>
      <div>
        <StyledToggleWrap $active={active} onClick={() => toggleRule()}>
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
