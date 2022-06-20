import api from "api";
import { Tooltip } from "components";
import React, { MouseEventHandler } from "react";
import { useQuery } from "react-query";
import { StyledClose, StyledLabel, StyledTab } from "./EntityDetailTabStyles";

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
  const { status, data, error, isFetching } = useQuery(
    ["entity", entityId],
    async () => {
      const res = await api.detailGet(entityId);
      return res.data;
    },
    { enabled: !!entityId && api.isLoggedIn() }
  );

  return (
    <StyledTab isSelected={isSelected}>
      <Tooltip label={data && data.label}>
        <StyledLabel onClick={onClick}>
          {data ? data.label : entityId}
        </StyledLabel>
      </Tooltip>
      <StyledClose onClick={onClose}>{"x"}</StyledClose>
    </StyledTab>
  );
};
