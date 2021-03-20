import React, { FC, useState } from "react";

import { LabelWrapper, ToggleWrapper } from "./ToggleStyles";
import { Colors, Entities } from "types";

interface Toggle {
  optionList: String[] | JSX.Element[];
  inverted?: boolean;
  color?: typeof Colors[number];
}
export const Toggle: FC<Toggle> = ({
  optionList = "",
  inverted = false,
  color = "primary",
}) => {
  const [selected, setSelected] = useState(0);
  const chooseNext = () => {
    if (selected < optionList.length - 1) {
      setSelected(selected + 1);
    } else {
      setSelected(0);
    }
  };

  return (
    <ToggleWrapper color={color} inverted={inverted}>
      <LabelWrapper
        onClick={() => chooseNext()}
        hasIcon={typeof optionList[selected] !== "string"}
      >
        {optionList[selected]}
      </LabelWrapper>
    </ToggleWrapper>
  );
};
