import React from "react";

import { Toggle } from "components";

interface ICertaintyToggle {}

export const CertaintyToggle: React.FC<ICertaintyToggle> = ({}) => {
  return <Toggle optionList={["certain", "uncertain"]} />;
};
