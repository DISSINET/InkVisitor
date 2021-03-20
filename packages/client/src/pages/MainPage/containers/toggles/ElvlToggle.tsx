import React from "react";

import { Toggle } from "components";

interface IElvlToggle {}

export const ElvlToggle: React.FC<IElvlToggle> = ({}) => {
  return (
    <Toggle
      optionList={[
        { value: "certain", label: "certain" },
        { value: "uncertain", label: "uncertain" },
      ]}
    />
  );
};
