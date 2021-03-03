import React, { FC, useState } from "react";

import { Button } from "components";
import { Colors } from "types";

interface Toggle {
  optionList: string[];
  inverted?: boolean;
  color?: typeof Colors[number];
}
export const Toggle: FC<Toggle> = ({
  optionList,
  inverted,
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
    <Button
      label={optionList[selected]}
      onClick={() => chooseNext()}
      color={color}
      inverted={inverted}
    />
  );
};
