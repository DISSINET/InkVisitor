import { elvlDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IconButtonGroup } from "components";
import React from "react";
import { BiLinkExternal } from "react-icons/bi";
import { MdDatasetLinked } from "react-icons/md";
import { RxFileText } from "react-icons/rx";

const icons = {
  [EntityEnums.Elvl.Textual]: <RxFileText size={14} />,
  [EntityEnums.Elvl.Interpretive]: <MdDatasetLinked size={14} />,
  [EntityEnums.Elvl.Inferential]: <BiLinkExternal size={14} />,
};
interface ElvlButtonGroup {
  border?: boolean;
  value: EntityEnums.Elvl;
  onChange: (elvl: EntityEnums.Elvl) => void;
}
export const ElvlButtonGroup: React.FC<ElvlButtonGroup> = ({
  border = false,
  value,
  onChange,
}) => {
  return (
    <IconButtonGroup<EntityEnums.Elvl>
      border={border}
      icons={icons}
      options={elvlDict}
      onChange={onChange}
      value={value}
    />
  );
};
