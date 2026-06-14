import { WarningTypeEnums } from "@inkvisitor/shared/enums";
import { globalValidationsDict } from "@inkvisitor/shared/enums/warning";
import { Tooltip } from "components/basic/Tooltip/Tooltip";
import React, { useState } from "react";
import { TiWarningOutline } from "react-icons/ti";
import { StyledWarningCode, StyledWarningIcon } from "./WarningIconStyles";

interface WarningIcon {
  type?: WarningTypeEnums;
  size?: number;
  // when true, renders the warning type code (e.g. "PSM") next to the icon
  // so the same warning can be matched across views
  showCode?: boolean;
  // when false, the icon won't render its own tooltip (e.g. when a parent
  // element already provides one for the whole row)
  showTooltip?: boolean;
}
export const WarningIcon: React.FC<WarningIcon> = ({
  type,
  size = 20,
  showCode = true,
  showTooltip: enableTooltip = true,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const dictEntry = type ? globalValidationsDict[`validation_${type}`] : undefined;
  const description = dictEntry?.description;

  return (
    <>
      <StyledWarningIcon
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <TiWarningOutline size={size} />
        {showCode && type && <StyledWarningCode>{type}</StyledWarningCode>}
      </StyledWarningIcon>

      {enableTooltip && description && (
        <Tooltip
          label={dictEntry?.label}
          content={<p>{description}</p>}
          visible={showTooltip}
          referenceElement={referenceElement}
        />
      )}
    </>
  );
};
