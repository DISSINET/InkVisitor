import api from "api";
import { Button, Tooltip } from "components";
import React, { MouseEventHandler } from "react";
import { useQuery } from "react-query";
import { StyledLabel, StyledTab } from "./EntityDetailTabStyles";

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
      <Button label="x" onClick={onClose} inverted />
    </StyledTab>
  );
};
