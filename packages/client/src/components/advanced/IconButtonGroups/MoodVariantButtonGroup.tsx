import { moodVariantsDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup } from "components";
import React from "react";
import { FaHeadSideVirus } from "react-icons/fa";
import { BsBoxSeamFill } from "react-icons/bs";
import { GiConversation } from "react-icons/gi";

const icons = {
  [EntityEnums.MoodVariant.Realis]: <FaHeadSideVirus size={14} />,
  [EntityEnums.MoodVariant.Irrealis]: <BsBoxSeamFill size={14} />,
  [EntityEnums.MoodVariant.ToBeDecided]: <GiConversation size={14} />,
};
interface MoodVariantButtonGroup {
  border?: boolean;
  value: EntityEnums.MoodVariant;
  onChange: (moodvariant: EntityEnums.MoodVariant) => void;
}
export const MoodVariantButtonGroup: React.FC<MoodVariantButtonGroup> = ({
  border = false,
  value,
  onChange,
}) => {
  return (
    <IconButtonGroup<EntityEnums.MoodVariant>
      border={border}
      icons={icons}
      options={moodVariantsDict}
      onChange={onChange}
      value={value}
    />
  );
};
