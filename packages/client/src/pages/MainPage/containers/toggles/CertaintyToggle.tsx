import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

import { Toggle } from "components";

import { certaintyDict } from "./../../../../../../shared/dictionaries";

interface ICertaintyToggle {}

export const CertaintyToggle: React.FC<ICertaintyToggle> = ({}) => {
  return (
    <Toggle
      icon={<FaQuestionCircle />}
      inverted
      onChangeFn={(newValue) => {
        console.log(newValue);
      }}
      optionList={certaintyDict}
    />
  );
};
