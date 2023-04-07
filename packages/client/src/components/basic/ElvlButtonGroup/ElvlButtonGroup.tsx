import { EntityEnums } from "@shared/enums";
import React, { useState } from "react";
import { BiLinkExternal } from "react-icons/bi";
import { RxFileText } from "react-icons/rx";
import { MdDatasetLinked } from "react-icons/md";

interface ElvlButtonGroup {
  onChange: (elvl: EntityEnums.Elvl) => void;
}
export const ElvlButtonGroup: React.FC<ElvlButtonGroup> = ({}) => {
  const [elvl, setElvl] = useState(EntityEnums.Elvl.Textual);

  return (
    <>
      <RxFileText />
      <MdDatasetLinked />
      <BiLinkExternal />
    </>
  );
};
