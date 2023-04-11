import { actantPositionDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup, IconFont } from "components";
import React from "react";

const icons = {
  [EntityEnums.Position.Subject]: <IconFont letter="S" />,
  [EntityEnums.Position.Actant1]: <IconFont letter="A1" />,
  [EntityEnums.Position.Actant2]: <IconFont letter="A2" />,
  [EntityEnums.Position.PseudoActant]: <IconFont letter="PA" />,
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
