import { Button } from "components";
import React, { MouseEventHandler } from "react";
import { StyledTab } from "./EntityDetailTabStyles";

interface EntityDetailTab {
  entityId: string;
  label: string;
  onClick?: MouseEventHandler<HTMLElement>;
  onClose?: () => void;
  isSelected?: boolean;
}
export const EntityDetailTab: React.FC<EntityDetailTab> = ({
  entityId,
  label,
  onClick,
  onClose,
  isSelected = false,
}) => {
  return (
    <StyledTab onClick={onClick} isSelected={isSelected}>
      {label}
      <Button label="x" onClick={onClose} />
    </StyledTab>
  );
};
