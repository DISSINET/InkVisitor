import { elvlDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
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
  sharpCorners?: boolean;
  value: EntityEnums.Elvl;
  onChange: (elvl: EntityEnums.Elvl) => void;
  disabled?: boolean;
  // warning ring prompting the user to choose an elvl
  warning?: boolean;
}
export const ElvlButtonGroup: React.FC<ElvlButtonGroup> = ({
  border = false,
  sharpCorners = false,
  value,
  onChange,
  disabled,
  warning,
}) => {
  return (
    <IconButtonGroup<EntityEnums.Elvl>
      attributeName="epistemic level"
      border={border}
      sharpCorners={sharpCorners}
      icons={icons}
      options={elvlDict}
      onChange={onChange}
      value={value}
      disabled={disabled}
      warning={warning}
    />
  );
};
