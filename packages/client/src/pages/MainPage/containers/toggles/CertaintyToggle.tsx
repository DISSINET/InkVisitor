import React from "react";

import { Toggle } from "components";

interface ICertaintyToggle {}

export const CertaintyToggle: React.FC<ICertaintyToggle> = ({}) => {
  return (
    <Toggle
      optionList={[
        { value: "certain", label: "certain" },
        { value: "uncertain", label: "uncertain" },
      ]}
    />
  );
};
