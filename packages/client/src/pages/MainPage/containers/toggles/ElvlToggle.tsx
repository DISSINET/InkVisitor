import React from "react";
import { FaBook } from "react-icons/fa";

import { Toggle } from "components";

import { elvlDict } from "./../../../../../../shared/dictionaries";

interface IElvlToggle {
  onChangeFn: Function;
  value: string;
}

export const ElvlToggle: React.FC<IElvlToggle> = ({ onChangeFn, value }) => {
  const items = elvlDict.map((i) => {
    return {
      value: i.value,
      label: i.value,
      tooltip: i.label,
    };
  });
  const selectedItemNo = items.map((i) => i.value).indexOf(value) || 0;
  return (
    <Toggle
      icon={<FaBook />}
      inverted
      onChangeFn={(newValue) => {
        onChangeFn(newValue.value);
      }}
      optionList={items}
      selectedValue={value}
    />
  );
};
