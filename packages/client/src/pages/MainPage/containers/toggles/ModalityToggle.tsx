import React from "react";

import { Toggle } from "components";

interface IModalityToggle {}

export const ModalityToggle: React.FC<IModalityToggle> = ({}) => {
  return <Toggle optionList={["certain", "uncertain"]} />;
};
