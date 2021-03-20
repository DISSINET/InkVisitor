import React, { FC, useEffect, useState } from "react";

import { LabelWrapper, ToggleWrapper } from "./ToggleStyles";
import { Colors, ToggleItem } from "types";

interface Toggle {
  optionList: ToggleItem[];
  inverted?: boolean;
  color?: typeof Colors[number];
  onChangeFn?: (item: ToggleItem) => void;
}
export const Toggle: FC<Toggle> = ({
  optionList = [{ value: "", label: "" }],
  inverted = false,
  color = "primary",
  onChangeFn = (item: ToggleItem) => {},
}) => {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    onChangeFn(optionList[selected]);
  }, [selected]);

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
        hasIcon={typeof optionList[selected].label !== "string"}
      >
        {optionList[selected].label}
      </LabelWrapper>
    </ToggleWrapper>
  );
};
