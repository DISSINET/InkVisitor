import React from "react";
import { IoMdChatbubbles } from "react-icons/io";

import { Toggle } from "components";

import { modalityDict } from "./../../../../../../shared/dictionaries";

interface IModalityToggle {
  onChangeFn: Function;
  value: string;
}

export const ModalityToggle: React.FC<IModalityToggle> = ({
  onChangeFn,
  value,
}) => {
  const items = modalityDict.map((i) => {
    return {
      value: i.value,
      label: i.value,
      tooltip: i.label,
    };
  });

  return (
    <Toggle
      icon={<IoMdChatbubbles />}
      inverted
      onChangeFn={(newValue) => {
        onChangeFn(newValue.value);
      }}
      optionList={items}
      selectedValue={value}
    />
  );
};
