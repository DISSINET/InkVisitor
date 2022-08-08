import { EntityClass } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler } from "react";
import {
  StyledCgClose,
  StyledClose,
  StyledLabel,
  StyledTab,
  StyledTypeWrapper,
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
  const tabLabel = entity?.label || entity?.data.text || "no label";
  return (
    <StyledTab isSelected={isSelected}>
      <Tooltip label={tabLabel}>
        <StyledLabel
          isItalic={entity?.class === EntityClass.Statement && !entity?.label}
          onClick={onClick}
        >
          {entity?.class && (
            <TypeBar
              entityLetter={entity?.class}
              isTemplate={entity.isTemplate}
              noMargin
            />
          )}
          {!entity ? "..." : tabLabel}
        </StyledLabel>
      </Tooltip>
      <StyledClose onClick={onClose}>
        <StyledCgClose size={13} strokeWidth={0.5} />
      </StyledClose>
    </StyledTab>
  );
};
