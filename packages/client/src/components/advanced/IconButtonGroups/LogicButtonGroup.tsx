import { logicDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup } from "components";
import React from "react";
import { BiCommentAdd, BiCommentMinus } from "react-icons/bi";

const icons = {
  [EntityEnums.Logic.Positive]: <BiCommentAdd size={14} />,
  [EntityEnums.Logic.Negative]: <BiCommentMinus size={14} />,
};
interface LogicButtonGroup {
  border?: boolean;
  value: EntityEnums.Logic;
  onChange: (logic: EntityEnums.Logic) => void;
}
export const LogicButtonGroup: React.FC<LogicButtonGroup> = ({
  border = false,
  value,
  onChange,
}) => {
  return (
    <IconButtonGroup<EntityEnums.Logic>
      border={border}
      icons={icons}
      options={logicDict}
      onChange={onChange}
      value={value}
    />
  );
};
