import { EntityEnums } from "@shared/enums";
import React, { useEffect, useState } from "react";
import { BiLinkExternal } from "react-icons/bi";
import { RxFileText } from "react-icons/rx";
import { MdDatasetLinked } from "react-icons/md";
import { elvlDict } from "@shared/dictionaries";
import { Button } from "components";
import { StyledElvlWrapper } from "./ElvlButtonGroupStyles";

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
  const [elvl, setElvl] = useState<EntityEnums.Elvl | false>(false);

  useEffect(() => {
    setElvl(value);
  }, [value]);

  return (
    <StyledElvlWrapper border={border}>
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
                onChange(option.value);
              }
            }}
          />
        );
      })}
    </StyledElvlWrapper>
  );
};
