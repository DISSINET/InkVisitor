import { moodVariantsDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup } from "components";
import React from "react";
import { FaHeadSideVirus } from "react-icons/fa";
import { BsBoxSeamFill } from "react-icons/bs";
import { VscCommentDiscussion } from "react-icons/vsc";

const icons = {
  [EntityEnums.MoodVariant.Realis]: <FaHeadSideVirus size={14} />,
  [EntityEnums.MoodVariant.Irrealis]: <BsBoxSeamFill size={14} />,
  [EntityEnums.MoodVariant.ToBeDecided]: <VscCommentDiscussion size={14} />,
};
interface MoodVariantButtonGroup {
  border?: boolean;
  value: EntityEnums.MoodVariant;
  onChange: (moodvariant: EntityEnums.MoodVariant) => void;
  disabled?: boolean;
}
export const MoodVariantButtonGroup: React.FC<MoodVariantButtonGroup> = ({
  border = false,
  value,
  onChange,
  disabled,
}) => {
  return (
    <IconButtonGroup<EntityEnums.MoodVariant>
      attributeName="mood variant"
      border={border}
      icons={icons}
      options={moodVariantsDict}
      onChange={onChange}
      value={value}
      disabled={disabled}
    />
  );
};
