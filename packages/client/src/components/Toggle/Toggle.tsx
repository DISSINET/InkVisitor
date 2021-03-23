import React, { FC, useMemo } from "react";

import { StyledLabel, StyledToggle, StyledIcon } from "./ToggleStyles";
import { Colors, ToggleItem } from "types";
import { Tooltip } from "components";

interface Toggle {
  optionList: ToggleItem[];
  selectedValue: string;
  inverted?: boolean;
  color?: typeof Colors[number];
  onChangeFn?: (item: ToggleItem) => void;
  icon?: React.ReactElement;
}
export const Toggle: FC<Toggle> = ({
  optionList = [{ value: "", label: "" }],
  selectedValue = optionList[0].value,
  inverted = false,
  color = "primary",
  onChangeFn = (item: ToggleItem) => {},
  icon = false,
}) => {
  const selectedIndex = useMemo(() => {
    const selectedOption = optionList.find((o) => o.value === selectedValue);

    if (selectedOption) {
      return optionList.indexOf(selectedOption);
    } else {
      return 0;
    }
  }, [selectedValue]);

  const tooltip = useMemo(() => {
    return optionList[selectedIndex].tooltip || "";
  }, [selectedIndex]);

  const chooseNext = () => {
    if (selectedIndex < optionList.length - 1) {
      onChangeFn(optionList[selectedIndex + 1]);
    } else {
      onChangeFn(optionList[0]);
    }
  };

  return (
    <Tooltip
      trigger={
        <StyledToggle
          color={color}
          inverted={inverted}
          onClick={() => chooseNext()}
        >
          {icon && <StyledIcon>{icon}</StyledIcon>}
          <StyledLabel
            hasIcon={typeof optionList[selectedIndex].label !== "string"}
          >
            {optionList[selectedIndex].label}
          </StyledLabel>
        </StyledToggle>
      }
      position={["bottom left", "top left"]}
      on={["hover", "focus"]}
      tooltip={tooltip}
    />
  );
};
