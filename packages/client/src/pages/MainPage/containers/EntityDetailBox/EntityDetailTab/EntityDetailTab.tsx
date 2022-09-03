import { EntityEnums } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler } from "react";
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
  return (
    <StyledTab isSelected={isSelected}>
      <Tooltip label={getEntityLabel(entity)}>
        <StyledLabel
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
            />
          )}
          {!entity ? "..." : getEntityLabel(entity)}
        </StyledLabel>
      </Tooltip>
      <StyledClose onClick={onClose}>
        <StyledCgClose size={13} strokeWidth={0.5} />
      </StyledClose>
    </StyledTab>
  );
};
