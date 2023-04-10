import { actantPositionDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup, IconFont } from "components";
import React from "react";

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
  const icons = {
    [EntityEnums.Position.Subject]: (
      <IconFont
        letter="S"
        color={value === EntityEnums.Position.Subject ? "primary" : "greyer"}
      />
    ),
    [EntityEnums.Position.Actant1]: (
      <IconFont
        letter="A1"
        color={value === EntityEnums.Position.Actant1 ? "primary" : "greyer"}
      />
    ),
    [EntityEnums.Position.Actant2]: (
      <IconFont
        letter="A2"
        color={value === EntityEnums.Position.Actant2 ? "primary" : "greyer"}
      />
    ),
    [EntityEnums.Position.PseudoActant]: (
      <IconFont
        letter="PA"
        color={
          value === EntityEnums.Position.PseudoActant ? "primary" : "greyer"
        }
      />
    ),
  };
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
