import { EntityEnums } from "@shared/enums";
import React, { useState } from "react";
import { BiLinkExternal } from "react-icons/bi";
import { RxFileText } from "react-icons/rx";
import { MdDatasetLinked } from "react-icons/md";
import { elvlDict } from "@shared/dictionaries";
import { Button } from "components";

const icons = {
  [EntityEnums.Elvl.Textual]: <RxFileText />,
  [EntityEnums.Elvl.Interpretive]: <MdDatasetLinked />,
  [EntityEnums.Elvl.Inferential]: <BiLinkExternal />,
};
interface ElvlButtonGroup {
  onChange: (elvl: EntityEnums.Elvl) => void;
}
export const ElvlButtonGroup: React.FC<ElvlButtonGroup> = ({}) => {
  const [elvl, setElvl] = useState(EntityEnums.Elvl.Textual);

  return (
    <>
      {elvlDict.map((option, key) => {
        return (
          <Button
            key={key}
            icon={icons[option.value]}
            tooltipLabel={option.label}
            noBorder
            inverted
            color={option.value === elvl ? "primary" : "greyer"}
            onClick={() => {
              if (option.value !== elvl) {
                setElvl(option.value);
              }
            }}
          />
        );
      })}
    </>
  );
};
