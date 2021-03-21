import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

import { Toggle } from "components";

import { certaintyDict } from "./../../../../../../shared/dictionaries";

interface ICertaintyToggle {
  onChangeFn: Function;
  value: string;
}

export const CertaintyToggle: React.FC<ICertaintyToggle> = ({
  onChangeFn,
  value,
}) => {
  const items = certaintyDict.map((i) => {
    return {
      value: i.value,
      label: i.value,
      tooltip: i.label,
    };
  });
  return (
    <Toggle
      icon={<FaQuestionCircle />}
      inverted
      onChangeFn={(newValue) => {
        onChangeFn(newValue.value);
      }}
      selectedValue={value}
      optionList={items}
    />
  );
};
