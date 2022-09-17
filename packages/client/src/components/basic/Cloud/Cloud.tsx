import React, { ReactElement } from "react";
import { StyledCloud } from "./CloudStyles";

interface Cloud {
  children: ReactElement;
}
export const Cloud: React.FC<Cloud> = ({ children }) => {
  return <StyledCloud>{children}</StyledCloud>;
};
