import { actantPositionDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup, IconFont } from "components";
import React from "react";

const icons = {
  [EntityEnums.Position.Subject]: <IconFont letter="S" size={14} />,
  [EntityEnums.Position.Actant1]: <IconFont letter="A1" size={14} />,
  [EntityEnums.Position.Actant2]: <IconFont letter="A2" size={14} />,
  [EntityEnums.Position.PseudoActant]: <IconFont letter="PA" size={14} />,
};
interface PositionButtonGroup {
  border?: boolean;
  value: EntityEnums.Position;
  onChange: (position: EntityEnums.Position) => void;
}
export const PositionButtonGroup: React.FC<PositionButtonGroup> = ({
  border = false,
  value,
  onChange,
}) => {
  return (
    <IconButtonGroup<EntityEnums.Position>
      border={border}
      icons={icons}
      options={Object.values(actantPositionDict)}
      onChange={onChange}
      value={value}
    />
  );
};
