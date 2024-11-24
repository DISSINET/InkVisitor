import {
  globalValidationsDict,
  WarningKey,
  WarningTypeEnums,
} from "@shared/enums/warning";
import React from "react";
import {
  StyledGridFormLabel,
  StyledToggleWrap,
} from "./GlobalValidationsModalStyles";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

interface GlobalValidationsSettingsRow {
  validation: WarningKey;
  active: boolean;
  toggleRule: () => void;
}
export const GlobalValidationsSettingsRow: React.FC<
  GlobalValidationsSettingsRow
> = ({ validation, active, toggleRule }) => {
  const isDisabled = !globalValidationsDict[validation].editAllowed;
  return (
    <React.Fragment>
      <StyledGridFormLabel $disabled={isDisabled}>
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
    </React.Fragment>
  );
};
