import React from "react";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityLetter: string;
}
export const TypeBar: React.FC<TypeBar> = ({ entityLetter }) => {
  return <StyledTypeBar entity={`entity${entityLetter}`} />;
};
