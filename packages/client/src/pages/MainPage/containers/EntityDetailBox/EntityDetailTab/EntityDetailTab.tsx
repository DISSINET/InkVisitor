import api from "api";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler } from "react";
import { CgClose } from "react-icons/cg";
import { useQuery } from "react-query";
import {
  StyledClose,
  StyledItalic,
  StyledLabel,
  StyledTab,
} from "./EntityDetailTabStyles";

interface EntityDetailTab {
  entityId: string;

  onClick?: MouseEventHandler<HTMLElement>;
  onClose?: () => void;
  isSelected?: boolean;
}
export const EntityDetailTab: React.FC<EntityDetailTab> = ({
  entityId,

  onClick,
  onClose,
  isSelected = false,
}) => {
  const {
    status,
    data: entity,
    error,
    isFetching,
  } = useQuery(
    ["entity", entityId],
    async () => {
      const res = await api.detailGet(entityId);
      return res.data;
    },
    { enabled: !!entityId && api.isLoggedIn() }
  );

  return (
    <StyledTab isSelected={isSelected}>
      <Tooltip disabled={!entity?.label} label={entity?.label && entity.label}>
        <StyledLabel onClick={onClick}>
          {entity?.class && <TypeBar entityLetter={entity?.class} noMargin />}
          {!entity ? (
            "..."
          ) : entity.label ? (
            entity.label
          ) : (
            <StyledItalic style={{ fontSize: "1.0rem" }}>
              {"no label"}
            </StyledItalic>
          )}
        </StyledLabel>
      </Tooltip>
      <StyledClose onClick={onClose}>
        <CgClose size={11} strokeWidth={0.5} />
      </StyledClose>
    </StyledTab>
  );
};
