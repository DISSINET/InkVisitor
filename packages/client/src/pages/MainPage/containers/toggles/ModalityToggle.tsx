import React from "react";
import { IoMdChatbubbles } from "react-icons/io";

import { Toggle } from "components";

import { modalityDict } from "./../../../../../../shared/dictionaries";

interface IModalityToggle {}

export const ModalityToggle: React.FC<IModalityToggle> = ({}) => {
  return (
    <Toggle
      icon={<IoMdChatbubbles />}
      inverted
      onChangeFn={(newValue) => {
        console.log(newValue);
      }}
      optionList={modalityDict}
    />
  );
};
