import { WarningTypeEnums } from "@inkvisitor/shared/enums";
import React from "react";
import { TiWarningOutline } from "react-icons/ti";
import { StyledWarningCode, StyledWarningIcon } from "./WarningIconStyles";

interface WarningIcon {
  type?: WarningTypeEnums;
  size?: number;
  // when true, renders the warning type code (e.g. "PSM") next to the icon
  // so the same warning can be matched across views
  showCode?: boolean;
}
export const WarningIcon: React.FC<WarningIcon> = ({
  type,
  size = 20,
  showCode = true,
}) => {
  return (
    <StyledWarningIcon>
      <TiWarningOutline size={size} />
      {showCode && type && <StyledWarningCode>{type}</StyledWarningCode>}
    </StyledWarningIcon>
  );
};
