import { EntityClass } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import api from "api";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler } from "react";
import { useQuery } from "react-query";
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
      <Tooltip
        disabled={!entity?.label && !entity?.data.text}
        label={entity?.label || entity?.data.text}
      >
        <StyledLabel
          isItalic={entity?.class === EntityClass.Statement}
          onClick={onClick}
        >
          {entity?.class && <TypeBar entityLetter={entity?.class} noMargin />}
          {!entity ? "..." : entity.label || entity.data.text || "no label"}
        </StyledLabel>
      </Tooltip>
      <StyledClose onClick={onClose}>
        <StyledCgClose size={13} strokeWidth={0.5} />
      </StyledClose>
    </StyledTab>
  );
};
