import React from "react";
import { FaBook } from "react-icons/fa";

import { Toggle } from "components";

import { elvlDict } from "./../../../../../../shared/dictionaries";

interface IElvlToggle {}

export const ElvlToggle: React.FC<IElvlToggle> = ({}) => {
  return (
    <Toggle
      icon={<FaBook />}
      inverted
      onChangeFn={(newValue) => {
        console.log(newValue);
      }}
      optionList={elvlDict}
    />
  );
};
