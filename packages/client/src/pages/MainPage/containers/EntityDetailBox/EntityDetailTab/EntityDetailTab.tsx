import { EntityEnums } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler, useState } from "react";
import { getEntityLabel } from "utils";
import {
  StyledCgClose,
  StyledClose,
  StyledLabel,
  StyledTab,
} from "./EntityDetailTabStyles";

interface EntityDetailTab {
  entity: IResponseEntity;
  onClick?: MouseEventHandler<HTMLElement>;
  onClose?: () => void;
  isSelected?: boolean;
}
export const EntityDetailTab: React.FC<EntityDetailTab> = ({
  entity,
  onClick,
  onClose,
  isSelected = false,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledTab
        isSelected={isSelected}
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <StyledLabel
          isSelected={isSelected}
          isItalic={
            entity?.class === EntityEnums.Class.Statement && !entity?.label
          }
          onClick={onClick}
        >
          {entity?.class && (
            <TypeBar
              entityLetter={entity?.class}
              isTemplate={entity.isTemplate}
              noMargin
              dimColor={!isSelected}
            />
          )}
          {!entity ? "..." : getEntityLabel(entity)}
        </StyledLabel>

        <StyledClose onClick={onClose}>
          <StyledCgClose size={13} strokeWidth={0.5} />
        </StyledClose>
      </StyledTab>

      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        label={getEntityLabel(entity)}
      />
    </>
  );
};
